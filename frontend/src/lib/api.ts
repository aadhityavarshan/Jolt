const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'Request failed');
  }
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'Request failed');
  }
  return res.json() as Promise<T>;
}

// ── Types ─────────────────────────────────────────────────────────────────────

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

export interface PatientDocument {
  filename: string;
  record_type: string;
  date: string | null;
}

export interface PatientDetail {
  patient: Patient;
  coverage: Coverage[];
  documents: PatientDocument[];
}

export interface CptCode {
  id: string;
  code: string;
  description: string;
  category: string;
}

export interface EvaluateTrigger {
  patient_id: string;
  cpt_code: string;
  payer: string;
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

export interface CriterionResult {
  criterion: string;
  met: boolean;
  confidence: number;
  evidence_quote: string | null;
  clinical_citation: string | null;
  policy_citation: string;
  reasoning: string;
}

// ── API client ─────────────────────────────────────────────────────────────────

export const api = {
  patients: {
    search: (q: string) =>
      get<Patient[]>(`/api/patients/search?q=${encodeURIComponent(q)}`),
    get: (id: string) => get<PatientDetail>(`/api/patients/${id}`),
  },
  cpt: {
    search: (q: string) =>
      get<CptCode[]>(`/api/cpt/search?q=${encodeURIComponent(q)}`),
  },
  evaluate: {
    trigger: (body: EvaluateTrigger) =>
      post<{ determination_id: string }>('/api/evaluate', body),
    get: (id: string) => get<{ status: string } & Partial<Determination>>(`/api/evaluate/${id}`),
  },
};
