import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '../db/supabase';

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('Missing ANTHROPIC_API_KEY in environment');
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-5-20250929';

// ─── Clinical Metadata ────────────────────────────────────────────────────────

export interface ClinicalMetadata {
  patient_id: string;
  record_type: string;
  date: string;
}

export async function extractClinicalMetadata(text: string): Promise<ClinicalMetadata> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Extract metadata from this clinical document. Return ONLY valid JSON with these fields:
- "patient_name": the patient's full name (first and last)
- "record_type": the type of clinical record (e.g. "Progress Note", "Lab Report", "Imaging Report", "Operative Note", "Discharge Summary")
- "date": the document date in YYYY-MM-DD format

If a field cannot be determined, use "Unknown" for strings and "1900-01-01" for date.

Document text:
${text.slice(0, 4000)}`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude returned no text for clinical metadata extraction');
  }

  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse JSON from clinical metadata response');
  }

  const parsed = JSON.parse(jsonMatch[0]) as {
    patient_name: string;
    record_type: string;
    date: string;
  };

  // Resolve patient name to UUID via fuzzy match
  const patientId = await resolvePatientId(parsed.patient_name);

  return {
    patient_id: patientId,
    record_type: parsed.record_type || 'Unknown',
    date: parsed.date || 'Unknown',
  };
}

async function resolvePatientId(patientName: string): Promise<string> {
  if (!patientName || patientName === 'Unknown') {
    throw new Error('Could not extract patient name from document. Please verify the document contains patient information.');
  }

  const parts = patientName.trim().split(/\s+/);

  let query = supabase
    .from('patients')
    .select('id, first_name, last_name');

  if (parts.length >= 2) {
    const [first, ...rest] = parts;
    const last = rest.join(' ');
    query = query
      .ilike('first_name', `%${first}%`)
      .ilike('last_name', `%${last}%`);
  } else {
    query = query.or(
      `first_name.ilike.%${parts[0]}%,last_name.ilike.%${parts[0]}%`
    );
  }

  const { data, error } = await query.limit(1);
  if (error) throw error;

  if (!data || data.length === 0) {
    throw new Error(
      `No patient found matching "${patientName}". Please verify this patient exists in the system.`
    );
  }

  console.log(`[metadataExtractor] Resolved "${patientName}" → ${data[0].id} (${data[0].first_name} ${data[0].last_name})`);
  return data[0].id;
}

// ─── Policy Metadata ──────────────────────────────────────────────────────────

export interface PolicyMetadata {
  payer: string;
  cpt_codes: string[];
  policy_id: string;
}

export async function extractPolicyMetadata(text: string): Promise<PolicyMetadata> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Extract metadata from this insurance policy document. Return ONLY valid JSON with these fields:
- "payer": the insurance company / payer name (e.g. "Aetna", "UnitedHealthcare", "Blue Cross Blue Shield")
- "cpt_codes": an array of CPT codes referenced in the document (e.g. ["27447", "27130"])
- "policy_id": the policy identifier or bulletin number (e.g. "CPB-0852")

If a field cannot be determined, use "Unknown" for strings and [] for cpt_codes.

Document text:
${text.slice(0, 4000)}`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude returned no text for policy metadata extraction');
  }

  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse JSON from policy metadata response');
  }

  const parsed = JSON.parse(jsonMatch[0]) as {
    payer: string;
    cpt_codes: string[];
    policy_id: string;
  };

  return {
    payer: parsed.payer || 'Unknown',
    cpt_codes: Array.isArray(parsed.cpt_codes) ? parsed.cpt_codes : [],
    policy_id: parsed.policy_id || 'Unknown',
  };
}
