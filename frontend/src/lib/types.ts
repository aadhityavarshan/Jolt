export interface Patient {
  id: string;
  name: string;
  dob: string;
  payer: string;
}

export interface Procedure {
  cptCode: string;
  label: string;
  hasLaterality: boolean;
}

export type Laterality = "left" | "right" | "both";

export type Verdict = "YES" | "MAYBE" | "NO";

export interface EvidenceQuote {
  text: string;
  source: string;
  page?: number;
}

export interface EvaluationResult {
  determinationId: string;
  verdict: Verdict;
  probability: number;
  reasons: string[];
  missingInfo: string[];
  evidence: EvidenceQuote[];
}

export interface EvaluateRequest {
  patient_id: string;
  cpt_code: string;
  payer: string;
}

export interface UploadClinicalRequest {
  patient_id: string;
  record_type: string;
  date: string;
  file: File;
}

export interface UploadPolicyRequest {
  payer: string;
  cpt_codes: string[];
  policy_id: string;
  file: File;
}
