import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '../db/supabase';
import { embed } from './embedder';
import type { CriterionResult, Determination, DocumentChunk } from '../types';

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
  const policyChunks = await searchChunks(
    `${cptCode} ${payer} prior authorization medical necessity criteria requirements`,
    { type: 'policy', payer },
    10,
    0.25
  );

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
    .map((c, i) => `[Chunk ${i + 1} — ${c.source_filename}, ID: ${c.id}]\n${c.content}`)
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
- "clinical_citation": string or null — the chunk ID (e.g., "Chunk 1 — filename") where evidence was found
- "reasoning": string — brief explanation of your decision

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
    return {
      criterion: criterion.criterion,
      met: Boolean(result.met),
      confidence: Number(result.confidence) || 0.5,
      evidence_quote: result.evidence_quote || null,
      clinical_citation: result.clinical_citation || null,
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
