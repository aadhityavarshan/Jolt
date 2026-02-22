import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '../db/supabase';
import { embed } from './embedder';
import type { Coverage, CptCode, CriterionResult, Determination, DocumentChunk, Patient, PriorAuthRequest } from '../types';

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('Missing ANTHROPIC_API_KEY in environment');
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-5-20250929';

// ---------------------------------------------------------------------------
// Stage 1: Extract policy criteria from matched policy chunks
// ---------------------------------------------------------------------------

interface PolicyCriterion {
  criterion: string;
  policy_citation: string;
}

async function searchChunks(
  queryText: string,
  filter: Record<string, unknown>,
  matchCount = 10,
  threshold = 0.3
): Promise<DocumentChunk[]> {
  const queryEmbedding = await embed(queryText);

  const { data, error } = await supabase.rpc('match_chunks', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: matchCount,
    filter,
  });

  if (error) throw new Error(`match_chunks failed: ${error.message}`);
  return data as DocumentChunk[];
}

export async function extractPolicyCriteria(
  cptCode: string,
  payer: string
): Promise<{ criteria: PolicyCriterion[]; policyChunks: DocumentChunk[] }> {
  // First try payer-specific policy
  let policyChunks = await searchChunks(
    `${cptCode} ${payer} prior authorization medical necessity criteria requirements`,
    { type: 'policy', payer },
    10,
    0.25
  );

  // Fallback: if no payer-specific policy found, use any available policy for this CPT code
  if (policyChunks.length === 0) {
    console.log(`[ragPipeline] No policy found for payer=${payer}, falling back to any available policy for CPT ${cptCode}`);
    policyChunks = await searchChunks(
      `${cptCode} prior authorization medical necessity criteria requirements`,
      { type: 'policy' },
      10,
      0.25
    );
  }

  if (policyChunks.length === 0) {
    return { criteria: [], policyChunks: [] };
  }

  const policyText = policyChunks
    .map((c, i) => `[Chunk ${i + 1} — ${c.source_filename}]\n${c.content}`)
    .join('\n\n---\n\n');

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `You are a prior authorization specialist. Given the following insurance policy excerpts for CPT code ${cptCode} (payer: ${payer}), extract ALL specific clinical criteria that must be met for prior authorization approval.

Policy excerpts:
${policyText}

Return a JSON array of objects with:
- "criterion": a specific, measurable clinical requirement (e.g., "Patient must be age 50 or older")
- "policy_citation": which policy section/chunk the criterion comes from

Return ONLY the JSON array, no other text. If no criteria are found, return [].`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    return { criteria: [], policyChunks };
  }

  try {
    const jsonStr = textBlock.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const criteria = JSON.parse(jsonStr) as PolicyCriterion[];
    return { criteria, policyChunks };
  } catch {
    console.error('Failed to parse criteria JSON:', textBlock.text);
    return { criteria: [], policyChunks };
  }
}

// ---------------------------------------------------------------------------
// Stage 2: Evaluate each criterion against patient clinical evidence
// ---------------------------------------------------------------------------

export async function evaluateCriterion(
  criterion: PolicyCriterion,
  patientId: string
): Promise<CriterionResult> {
  const clinicalChunks = await searchChunks(
    criterion.criterion,
    { type: 'clinical', patient_id: patientId },
    5,
    0.2
  );

  if (clinicalChunks.length === 0) {
    return {
      criterion: criterion.criterion,
      met: false,
      confidence: 0.9,
      evidence_quote: null,
      clinical_citation: null,
      policy_citation: criterion.policy_citation,
      reasoning: 'No relevant clinical documentation found for this criterion.',
    };
  }

  const clinicalText = clinicalChunks
    .map((c, i) => `[Chunk ${i + 1}]\nSource: ${c.source_filename}\n${c.content}`)
    .join('\n\n---\n\n');

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are a prior authorization clinical reviewer. Evaluate whether the following clinical criterion is met based on the patient's clinical records.

Criterion: "${criterion.criterion}"
Policy citation: ${criterion.policy_citation}

Clinical records:
${clinicalText}

Return a JSON object with:
- "met": boolean — is this criterion satisfied by the evidence?
- "confidence": number 0-1 — how confident are you?
- "evidence_quote": string or null — exact quote from clinical records supporting your decision
- "chunk_number": number or null — which chunk number (1-${clinicalChunks.length}) contains the evidence
- "reasoning": string — 2-3 concise bullet points (each on its own line, starting with "•") summarizing why the criterion is or is not met

Return ONLY the JSON object, no other text.`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    return {
      criterion: criterion.criterion,
      met: false,
      confidence: 0,
      evidence_quote: null,
      clinical_citation: null,
      policy_citation: criterion.policy_citation,
      reasoning: 'Failed to get evaluation from Claude.',
    };
  }

  try {
    const jsonStr = textBlock.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(jsonStr);

    // Resolve chunk_number to the actual chunk's source_filename
    let clinicalCitation: string | null = null;
    const chunkIdx = typeof result.chunk_number === 'number' ? result.chunk_number - 1 : -1;
    if (chunkIdx >= 0 && chunkIdx < clinicalChunks.length) {
      const chunk = clinicalChunks[chunkIdx];
      clinicalCitation = chunk.source_filename;
    }

    return {
      criterion: criterion.criterion,
      met: Boolean(result.met),
      confidence: Number(result.confidence) || 0.5,
      evidence_quote: result.evidence_quote || null,
      clinical_citation: clinicalCitation,
      policy_citation: criterion.policy_citation,
      reasoning: result.reasoning || '',
    };
  } catch {
    console.error('Failed to parse criterion evaluation:', textBlock.text);
    return {
      criterion: criterion.criterion,
      met: false,
      confidence: 0,
      evidence_quote: null,
      clinical_citation: null,
      policy_citation: criterion.policy_citation,
      reasoning: 'Failed to parse evaluation response.',
    };
  }
}

// ---------------------------------------------------------------------------
// Orchestrator: Run full two-stage evaluation
// ---------------------------------------------------------------------------

export async function runEvaluation(
  patientId: string,
  cptCode: string,
  payer: string,
  requestId: string
): Promise<Determination> {
  // Stage 1: Extract policy criteria
  const { criteria } = await extractPolicyCriteria(cptCode, payer);

  if (criteria.length === 0) {
    // No policy found — mark as insufficient info
    const determination: Omit<Determination, 'id'> = {
      request_id: requestId,
      probability_score: 0,
      recommendation: 'INSUFFICIENT_INFO',
      criteria_results: [],
      missing_info: [`No policy criteria found for CPT ${cptCode} with payer ${payer}. Ensure the relevant policy document has been uploaded.`],
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('determinations')
      .insert({
        request_id: requestId,
        probability_score: determination.probability_score,
        recommendation: determination.recommendation,
        criteria_results: determination.criteria_results,
        missing_info: determination.missing_info,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to insert determination: ${error.message}`);

    await supabase
      .from('prior_auth_requests')
      .update({ status: 'complete' })
      .eq('id', requestId);

    return data as Determination;
  }

  // Stage 2: Evaluate each criterion in parallel
  const criteriaResults = await Promise.all(
    criteria.map((c) => evaluateCriterion(c, patientId))
  );

  // Compute probability score: proportion of criteria met, weighted by confidence
  const totalWeight = criteriaResults.reduce((sum, r) => sum + r.confidence, 0);
  const metWeight = criteriaResults
    .filter((r) => r.met)
    .reduce((sum, r) => sum + r.confidence, 0);
  const probabilityScore = totalWeight > 0 ? Math.round((metWeight / totalWeight) * 100) / 100 : 0;

  // Determine recommendation
  let recommendation: Determination['recommendation'];
  if (probabilityScore >= 0.7) {
    recommendation = 'LIKELY_APPROVED';
  } else if (probabilityScore <= 0.3) {
    recommendation = 'LIKELY_DENIED';
  } else {
    recommendation = 'INSUFFICIENT_INFO';
  }

  // Collect missing info from unmet criteria
  const missingInfo = criteriaResults
    .filter((r) => !r.met)
    .map((r) => `${r.criterion} — ${r.reasoning}`);

  // Store determination
  const { data, error } = await supabase
    .from('determinations')
    .insert({
      request_id: requestId,
      probability_score: probabilityScore,
      recommendation,
      criteria_results: criteriaResults,
      missing_info: missingInfo,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to insert determination: ${error.message}`);

  // Update request status
  await supabase
    .from('prior_auth_requests')
    .update({ status: 'complete' })
    .eq('id', requestId);

  return data as Determination;
}

// ---------------------------------------------------------------------------
// Generate Letter of Medical Necessity from a completed determination
// ---------------------------------------------------------------------------

export async function generateLetter(determinationId: string): Promise<string> {
  // Fetch determination
  const { data: determination, error: detErr } = await supabase
    .from('determinations')
    .select('*')
    .eq('request_id', determinationId)
    .single();

  if (detErr || !determination) {
    throw new Error('Determination not found');
  }

  // Fetch the prior auth request for patient/CPT/payer context
  const { data: request, error: reqErr } = await supabase
    .from('prior_auth_requests')
    .select('*')
    .eq('id', determinationId)
    .single();

  if (reqErr || !request) {
    throw new Error('Prior auth request not found');
  }

  const paRequest = request as PriorAuthRequest;

  // Fetch patient info
  const { data: patient, error: patErr } = await supabase
    .from('patients')
    .select('*')
    .eq('id', paRequest.patient_id)
    .single();

  if (patErr || !patient) {
    throw new Error('Patient not found');
  }

  // Fetch coverage for member ID and plan name
  const { data: coverageRows } = await supabase
    .from('coverage')
    .select('*')
    .eq('patient_id', paRequest.patient_id)
    .eq('payer', paRequest.payer)
    .eq('is_active', true)
    .limit(1);

  const coverage = (coverageRows && coverageRows.length > 0 ? coverageRows[0] : null) as Coverage | null;

  // Fetch CPT code description
  const { data: cptRow } = await supabase
    .from('cpt_codes')
    .select('*')
    .eq('code', paRequest.cpt_code)
    .single();

  const cpt = cptRow as CptCode | null;

  const pat = patient as Patient;
  const det = determination as Determination;

  // Build patient identification block
  const patientBlock = [
    `Patient Name: ${pat.first_name} ${pat.last_name}`,
    `Date of Birth: ${pat.dob}`,
    pat.mrn ? `MRN: ${pat.mrn}` : null,
    `Insurance Payer: ${paRequest.payer}`,
    coverage?.member_id ? `Member ID: ${coverage.member_id}` : null,
    coverage?.plan_name ? `Plan: ${coverage.plan_name}` : null,
  ].filter(Boolean).join('\n');

  // Build procedure description
  const procedureName = cpt ? `${cpt.description} (CPT ${cpt.code})` : `CPT ${paRequest.cpt_code}`;
  const procedureCategory = cpt?.category ? `Category: ${cpt.category}` : '';

  // Build criteria summary for the prompt
  const metCriteria = det.criteria_results.filter((c: CriterionResult) => c.met);
  const unmetCriteria = det.criteria_results.filter((c: CriterionResult) => !c.met);

  const metSummary = metCriteria
    .map((c: CriterionResult) => {
      const evidence = c.evidence_quote ? `\n   Evidence: "${c.evidence_quote}"` : '';
      const source = c.clinical_citation ? `\n   Source document: ${c.clinical_citation}` : '';
      const policy = c.policy_citation ? `\n   Policy reference: ${c.policy_citation}` : '';
      return `- SATISFIED: ${c.criterion}${evidence}${source}${policy}\n   Reasoning: ${c.reasoning}`;
    })
    .join('\n\n');

  const unmetSummary = unmetCriteria
    .map((c: CriterionResult) => {
      const policy = c.policy_citation ? `\n   Policy reference: ${c.policy_citation}` : '';
      return `- NOT YET DOCUMENTED: ${c.criterion}${policy}\n   Reasoning: ${c.reasoning}`;
    })
    .join('\n\n');

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: `You are a physician writing a formal Letter of Medical Necessity (LMN) for a prior authorization request. Write a professional, detailed letter that a physician would sign and submit to an insurance company.

=== PATIENT & INSURANCE INFORMATION ===
${patientBlock}

=== REQUESTED PROCEDURE ===
Procedure: ${procedureName}
${procedureCategory}

=== PAYER CRITERIA EVALUATION (from ${paRequest.payer} policy) ===

Criteria satisfied by clinical evidence:
${metSummary || '(none)'}

Criteria not yet documented:
${unmetSummary || '(none — all criteria satisfied)'}

=== INSTRUCTIONS ===

Write the letter with these exact sections in this order:

1. DATE AND HEADER
   - Today's date: ${new Date().toISOString().split('T')[0]}
   - "To: Medical Director, ${paRequest.payer}"
   - "Re: Prior Authorization Request — ${procedureName}"
   - "Patient: ${pat.first_name} ${pat.last_name}, DOB: ${pat.dob}${coverage?.member_id ? `, Member ID: ${coverage.member_id}` : ''}"

2. OPENING PARAGRAPH
   - State you are the treating physician requesting prior authorization
   - Identify the patient, their primary condition, and the specific procedure requested
   - State the procedure is medically necessary

3. CLINICAL HISTORY AND DIAGNOSIS
   - Summarize the patient's relevant medical history based on the evidence found
   - Include severity and duration of condition if evident from the clinical records
   - Reference conservative treatments attempted if mentioned in the evidence

4. CLINICAL JUSTIFICATION (this is the most important section — be thorough)
   - For EACH satisfied criterion, write a paragraph explaining:
     a) What the payer's policy requires (reference the policy criterion)
     b) How the patient's clinical evidence meets that requirement
     c) Include DIRECT QUOTES from the clinical records as evidence — put these in quotation marks
     d) Name the source document for each quote

5. PENDING DOCUMENTATION (only if there are unmet criteria)
   - For each unmet criterion, acknowledge what documentation is still needed
   - State that supplemental records will be provided upon request

6. STATEMENT OF MEDICAL NECESSITY
   - A clear, firm paragraph stating that based on the clinical evidence reviewed, the requested procedure meets the standard of medical necessity
   - Reference that the patient meets the payer's own published clinical criteria

7. CLOSING
   - Offer to provide additional information
   - Include signature block:
     "Sincerely,"
     "[Treating Physician Name, MD]"
     "[Specialty]"
     "[Practice Name]"
     "[Phone] | [Fax]"
     "NPI: [Number]"

FORMATTING RULES:
- Write in plain text only — NO markdown (no #, *, -, or bullet characters)
- Use blank lines between paragraphs
- Use "CLINICAL JUSTIFICATION", "STATEMENT OF MEDICAL NECESSITY" etc. as section labels on their own line, in all caps
- Do NOT include approval probability or recommendation scores — this is a physician advocacy letter
- Maintain formal, authoritative medical tone throughout
- The letter should read as if written by a physician who has personally reviewed the patient's records`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Failed to generate letter from Claude');
  }

  return textBlock.text;
}
