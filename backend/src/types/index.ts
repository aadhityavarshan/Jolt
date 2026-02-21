export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  dob: string;
  mrn?: string;
}

export interface Coverage {
  id: string;
  patient_id: string;
  payer: string;
  member_id?: string;
  plan_name?: string;
  is_active: boolean;
}

export interface CptCode {
  id: string;
  code: string;
  description: string;
  category: string;
}

export interface DocumentChunk {
  id: string;
  content: string;
  metadata: ClinicalMetadata | PolicyMetadata;
  source_filename: string;
  similarity?: number;
}

export interface ClinicalMetadata {
  type: 'clinical';
  patient_id: string;
  record_type: string;
  date: string;
  source_filename: string;
}

export interface PolicyMetadata {
  type: 'policy';
  payer: string;
  policy_id: string;
  cpt_codes: string[];
  section_header: string;
}

export interface CriterionResult {
  criterion: string;
  met: boolean;
  confidence: number;
  evidence_quote: string | null;
  clinical_citation: string | null;
  policy_citation: string;
  reasoning: string;
}

export interface Determination {
  id: string;
  request_id: string;
  probability_score: number;
  recommendation: 'LIKELY_APPROVED' | 'LIKELY_DENIED' | 'INSUFFICIENT_INFO';
  criteria_results: CriterionResult[];
  missing_info: string[];
  created_at: string;
}

export interface PriorAuthRequest {
  id: string;
  patient_id: string;
  cpt_code: string;
  payer: string;
  status: string;
  created_at: string;
}
