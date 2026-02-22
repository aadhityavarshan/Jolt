export interface Patient {
  id: string;
  name: string;
  dob: string;
  payer: string;
}

export interface CoverageRecord {
  id: string;
  payer: string;
  member_id?: string | null;
  plan_name?: string | null;
  is_active: boolean;
}

export interface PatientDocument {
  filename: string;
  record_type: string;
  date: string | null;
}

export interface PatientProfile {
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    dob: string;
    mrn?: string | null;
  };
  coverage: CoverageRecord[];
  documents: PatientDocument[];
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

export interface EvaluationRun {
  determinationId: string;
  patientId: string;
  patientName: string;
  cptCode: string;
  payer: string;
  status: "pending" | "complete" | "error" | string;
  requestedAt: string;
  recommendation: "LIKELY_APPROVED" | "LIKELY_DENIED" | "INSUFFICIENT_INFO" | null;
  probabilityScore: number | null;
  missingInfoCount: number;
  completedAt: string | null;
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
