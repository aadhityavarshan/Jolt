import type {
  Patient,
  Procedure,
  EvaluateRequest,
  EvaluationResult,
} from "./types";

let useMock = true;

export const isMockMode = () => useMock;
export const setMockMode = (v: boolean) => { useMock = v; };

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Mock Data ──────────────────────────────────────────

const MOCK_PATIENTS: Patient[] = [
  { id: "p1", name: "Sarah Johnson", dob: "1985-03-14", payer: "Aetna" },
  { id: "p2", name: "James Martinez", dob: "1972-11-08", payer: "UnitedHealthcare" },
  { id: "p3", name: "Emily Chen", dob: "1990-07-22", payer: "Blue Cross Blue Shield" },
  { id: "p4", name: "Robert Williams", dob: "1968-01-30", payer: "Cigna" },
  { id: "p5", name: "Maria Garcia", dob: "1995-09-05", payer: "Humana" },
];

export const MOCK_PROCEDURES: Procedure[] = [
  { cptCode: "93306", label: "Echocardiogram", hasLaterality: false },
  { cptCode: "93458", label: "Cardiac catheterization", hasLaterality: false },
  { cptCode: "99242", label: "Heart surgery consult", hasLaterality: false },
  { cptCode: "72141", label: "Cervical spine MRI", hasLaterality: false },
  { cptCode: "72146", label: "Thoracic spine MRI", hasLaterality: false },
  { cptCode: "72148", label: "Lumbar spine MRI", hasLaterality: false },
  { cptCode: "99243", label: "Spinal fusion consult", hasLaterality: false },
];

const MOCK_RESULT: EvaluationResult = {
  verdict: "MAYBE",
  probability: 68,
  reasons: [
    "Patient has documented chronic knee pain for over 6 months.",
    "Conservative treatments (PT, injections) have been partially attempted.",
    "Imaging confirms moderate osteoarthritis in the target joint.",
  ],
  missingInfo: [
    "Physical therapy completion records (minimum 6 weeks required by payer).",
    "Updated BMI documentation within the last 90 days.",
    "Specialist referral letter from primary care physician.",
  ],
  evidence: [
    {
      text: "Total knee arthroplasty is considered medically necessary when the member has failed at least 3 months of conservative therapy including physical therapy.",
      source: "Aetna Clinical Policy Bulletin #0016",
      page: 4,
    },
    {
      text: "Documentation must include radiographic evidence of joint space narrowing, osteophyte formation, or subchondral sclerosis.",
      source: "Aetna Clinical Policy Bulletin #0016",
      page: 7,
    },
  ],
};

// ── API Functions ──────────────────────────────────────

export async function searchPatients(query: string): Promise<Patient[]> {
  if (useMock) {
    await delay(300);
    const q = query.toLowerCase();
    return MOCK_PATIENTS.filter((p) => p.name.toLowerCase().includes(q));
  }
  const res = await fetch(`/api/patients?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Failed to search patients");
  return res.json();
}

export async function searchProcedures(query: string): Promise<Procedure[]> {
  if (useMock) {
    await delay(200);
    const q = query.toLowerCase();
    return MOCK_PROCEDURES.filter(
      (p) => p.label.toLowerCase().includes(q) || p.cptCode.includes(q)
    );
  }
  const res = await fetch(`/api/procedures?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Failed to search procedures");
  return res.json();
}

export async function evaluate(req: EvaluateRequest): Promise<EvaluationResult> {
  if (useMock) {
    await delay(1500);
    return MOCK_RESULT;
  }
  const res = await fetch("/api/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error("Evaluation failed");
  return res.json();
}

export async function uploadClinical(patientId: string, file: File): Promise<void> {
  if (useMock) {
    await delay(1000);
    return;
  }
  const fd = new FormData();
  fd.append("patient_id", patientId);
  fd.append("file", file);
  const res = await fetch("/api/upload/clinical", { method: "POST", body: fd });
  if (!res.ok) throw new Error("Upload failed");
}

export async function uploadPolicy(payer: string, cptCodes: string[], file: File): Promise<void> {
  if (useMock) {
    await delay(1000);
    return;
  }
  const fd = new FormData();
  fd.append("payer", payer);
  fd.append("cpt_codes", cptCodes.join(","));
  fd.append("file", file);
  const res = await fetch("/api/upload/policy", { method: "POST", body: fd });
  if (!res.ok) throw new Error("Upload failed");
}
