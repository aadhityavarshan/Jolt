const API_BASE = import.meta.env.VITE_API_URL ?? '';

export interface PatientSummary {
  id: string;
  first_name: string;
  last_name: string;
  dob: string;
  mrn?: string;
  coverage: Array<{
    payer: string;
    plan_name?: string;
    is_active: boolean;
  }>;
}

export interface PatientDetail extends PatientSummary {
  coverage: Array<{
    id: string;
    payer: string;
    member_id?: string;
    plan_name?: string;
    is_active: boolean;
  }>;
}

export interface PatientDocument {
  source_filename: string;
  metadata: {
    record_type: string;
    date: string;
  };
  created_at: string;
}

export async function searchPatients(q: string): Promise<PatientSummary[]> {
  const res = await fetch(`${API_BASE}/api/patients/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error('Patient search failed');
  const data = await res.json();
  return data.patients as PatientSummary[];
}

export async function getPatient(id: string): Promise<{ patient: PatientDetail; documents: PatientDocument[] }> {
  const res = await fetch(`${API_BASE}/api/patients/${id}`);
  if (!res.ok) throw new Error('Failed to fetch patient');
  return res.json();
}
