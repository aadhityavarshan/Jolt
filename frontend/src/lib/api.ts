import type {
  EvaluateRequest,
  EvaluationResult,
  EvaluationRun,
  Patient,
  PatientProfile,
  Procedure,
} from "./types";

let useMock = false;

export const isMockMode = () => useMock;
export const setMockMode = (v: boolean) => {
  useMock = v;
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

function toUrl(path: string): string {
  if (!API_BASE) return path;
  return `${API_BASE}${path}`;
}

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const json = await res.json();
    if (json && typeof json.error === "string") {
      return json.error;
    }
  } catch {
    // Ignore JSON parse errors and fallback to status text.
  }
  return res.statusText || fallback;
}

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
  determinationId: "mock-determination-id",
  verdict: "MAYBE",
  probability: 68,
  reasons: [
    {
      reasoning: "• Patient reports persistent knee pain lasting over 6 months\n• Multiple clinical encounters document ongoing symptoms\n• Timeline meets payer minimum duration requirement",
      evidence: {
        text: "Total knee arthroplasty is considered medically necessary when the member has failed at least 3 months of conservative therapy including physical therapy.",
        source: "Aetna Clinical Policy Bulletin #0016",
        page: 4,
      },
    },
    {
      reasoning: "• Physical therapy initiated but records show incomplete course\n• Corticosteroid injections administered with limited relief\n• Full conservative treatment protocol not yet exhausted",
      evidence: {
        text: "Documentation must include radiographic evidence of joint space narrowing, osteophyte formation, or subchondral sclerosis.",
        source: "Aetna Clinical Policy Bulletin #0016",
        page: 7,
      },
    },
    {
      reasoning: "• X-ray findings show Kellgren-Lawrence grade III osteoarthritis\n• Imaging confirms joint space narrowing in the medial compartment\n• Radiological evidence supports surgical intervention",
      evidence: null,
    },
  ],
  missingInfo: [
    "Physical therapy completion records (minimum 6 weeks required by payer).",
    "Updated BMI documentation within the last 90 days.",
    "Specialist referral letter from primary care physician.",
  ],
  evidence: [],
};

function toMockProfile(patient: Patient): PatientProfile {
  const [first, ...rest] = patient.name.split(" ");
  return {
    patient: {
      id: patient.id,
      first_name: first,
      last_name: rest.join(" "),
      dob: patient.dob,
      mrn: `MRN-${patient.id.toUpperCase()}`,
    },
    coverage: [
      {
        id: `cov-${patient.id}`,
        payer: patient.payer,
        member_id: `MEM-${patient.id.toUpperCase()}`,
        plan_name: "PPO Gold",
        is_active: true,
      },
    ],
    documents: [
      {
        filename: `${patient.id}_progress_note.pdf`,
        record_type: "Progress Note",
        date: "2026-02-10",
      },
      {
        filename: `${patient.id}_imaging_report.pdf`,
        record_type: "Imaging",
        date: "2026-01-28",
      },
    ],
  };
}

export async function getAllPatients(): Promise<Patient[]> {
  if (useMock) {
    await delay(250);
    return [...MOCK_PATIENTS];
  }

  const res = await fetch(toUrl("/api/patients"));
  if (!res.ok) {
    throw new Error(await readError(res, "Failed to fetch patients"));
  }

  const rows = (await res.json()) as Array<{
    id: string;
    first_name: string;
    last_name: string;
    dob: string;
    payer?: string | null;
  }>;

  return rows.map((row) => ({
    id: row.id,
    name: `${row.first_name} ${row.last_name}`.trim(),
    dob: row.dob,
    payer: row.payer ?? "Unknown",
  }));
}

export async function getPatientProfile(patientId: string): Promise<PatientProfile> {
  if (useMock) {
    await delay(200);
    const patient = MOCK_PATIENTS.find((row) => row.id === patientId);
    if (!patient) {
      throw new Error("Patient not found");
    }
    return toMockProfile(patient);
  }

  const res = await fetch(toUrl(`/api/patients/${patientId}`));
  if (!res.ok) {
    throw new Error(await readError(res, "Failed to fetch patient profile"));
  }

  const body = (await res.json()) as {
    patient: {
      id: string;
      first_name: string;
      last_name: string;
      dob: string;
      mrn?: string | null;
    };
    coverage: Array<{
      id: string;
      payer: string;
      member_id?: string | null;
      plan_name?: string | null;
      is_active: boolean;
    }>;
    documents: Array<{
      filename: string;
      record_type: string;
      date: string | null;
    }>;
  };

  return {
    patient: body.patient,
    coverage: body.coverage ?? [],
    documents: body.documents ?? [],
  };
}

export async function searchPatients(query: string): Promise<Patient[]> {
  if (useMock) {
    await delay(300);
    const q = query.toLowerCase();
    return MOCK_PATIENTS.filter((p) => p.name.toLowerCase().includes(q));
  }
  const res = await fetch(toUrl(`/api/patients/search?q=${encodeURIComponent(query)}`));
  if (!res.ok) {
    throw new Error(await readError(res, "Failed to search patients"));
  }
  const rows = (await res.json()) as Array<{
    id: string;
    first_name: string;
    last_name: string;
    dob: string;
    payer?: string | null;
  }>;
  return rows.map((row) => ({
    id: row.id,
    name: `${row.first_name} ${row.last_name}`.trim(),
    dob: row.dob,
    payer: row.payer ?? "Unknown",
  }));
}

export async function searchProcedures(query: string): Promise<Procedure[]> {
  if (useMock) {
    await delay(200);
    const q = query.toLowerCase();
    return MOCK_PROCEDURES.filter((p) => p.label.toLowerCase().includes(q) || p.cptCode.includes(q));
  }
  const res = await fetch(toUrl(`/api/cpt/search?q=${encodeURIComponent(query)}`));
  if (!res.ok) {
    throw new Error(await readError(res, "Failed to search procedures"));
  }
  const rows = (await res.json()) as Array<{
    code: string;
    description: string;
  }>;
  return rows.map((row) => ({
    cptCode: row.code,
    label: row.description,
    hasLaterality: false,
  }));
}

export async function evaluate(req: EvaluateRequest): Promise<EvaluationResult> {
  if (useMock) {
    await delay(1500);
    return MOCK_RESULT;
  }
  const triggerRes = await fetch(toUrl("/api/evaluate"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!triggerRes.ok) {
    throw new Error(await readError(triggerRes, "Evaluation failed"));
  }

  const trigger = (await triggerRes.json()) as { determination_id: string };
  const timeoutMs = 35_000;
  const intervalMs = 1_200;
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    await delay(intervalMs);
    const pollRes = await fetch(toUrl(`/api/evaluate/${trigger.determination_id}`));
    if (!pollRes.ok) {
      throw new Error(await readError(pollRes, "Failed to poll evaluation"));
    }
    const poll = (await pollRes.json()) as {
      status: "pending" | "error" | "complete";
      message?: string;
      probability_score?: number;
      recommendation?: "LIKELY_APPROVED" | "LIKELY_DENIED" | "INSUFFICIENT_INFO";
      criteria_results?: Array<{
        reasoning?: string;
        evidence_quote?: string | null;
        policy_citation?: string;
        clinical_citation?: string | null;
      }>;
      missing_info?: string[];
    };

    if (poll.status === "pending") {
      continue;
    }
    if (poll.status === "error") {
      throw new Error(poll.message || "Evaluation failed");
    }
    if (poll.status === "complete") {
      const verdict =
        poll.recommendation === "LIKELY_APPROVED"
          ? "YES"
          : poll.recommendation === "LIKELY_DENIED"
            ? "NO"
            : "MAYBE";

      return {
        determinationId: trigger.determination_id,
        verdict,
        probability: Math.round((poll.probability_score ?? 0) * 100),
        reasons: poll.criteria_results
          ?.filter((c) => c.reasoning)
          .map((c) => ({
            reasoning: c.reasoning!,
            evidence: c.evidence_quote
              ? { text: c.evidence_quote, source: c.clinical_citation || c.policy_citation || "Clinical records" }
              : null,
          })) ?? [],
        missingInfo: poll.missing_info ?? [],
        evidence: [],
      };
    }
  }

  throw new Error("Evaluation timed out after 35 seconds");
}

export async function getDocumentContent(
  patientId: string,
  filename: string,
): Promise<{ filename: string; content: string; record_type: string; date: string | null }> {
  if (useMock) {
    await delay(300);
    return {
      filename,
      content: `Mock clinical document content for ${filename}.\n\nPatient shows signs of improvement following the prescribed treatment plan. Vitals are within normal range. Follow-up appointment scheduled in 4 weeks.\n\nAll lab results reviewed and within acceptable limits.`,
      record_type: filename.includes("imaging") ? "Imaging" : "Progress Note",
      date: "2026-02-10",
    };
  }

  const res = await fetch(toUrl(`/api/patients/${patientId}/documents/${encodeURIComponent(filename)}`));
  if (!res.ok) {
    throw new Error(await readError(res, "Failed to fetch document content"));
  }
  return res.json() as Promise<{ filename: string; content: string; record_type: string; date: string | null }>;
}

export function getDocumentPdfUrl(patientId: string, filename: string): string {
  return toUrl(`/api/patients/${patientId}/documents/${encodeURIComponent(filename)}/pdf`);
}

export async function uploadClinical(file: File): Promise<void> {
  if (useMock) {
    await delay(1000);
    return;
  }
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(toUrl("/api/upload/clinical"), { method: "POST", body: fd });
  if (!res.ok) {
    throw new Error(await readError(res, "Clinical upload failed"));
  }
}

export async function uploadPolicy(file: File): Promise<void> {
  if (useMock) {
    await delay(1000);
    return;
  }
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(toUrl("/api/upload/policy"), { method: "POST", body: fd });
  if (!res.ok) {
    throw new Error(await readError(res, "Policy upload failed"));
  }
}

export async function downloadLetter(determinationId: string): Promise<void> {
  if (useMock) {
    await delay(500);
    alert("Letter download is not available in mock mode.");
    return;
  }
  const res = await fetch(toUrl(`/api/evaluate/${determinationId}/letter`), {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error(await readError(res, "Failed to generate letter"));
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Letter_of_Medical_Necessity_${determinationId}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function getEvaluationRuns(): Promise<EvaluationRun[]> {
  if (useMock) {
    await delay(300);
    return [
      {
        determinationId: "mock-determination-id",
        patientId: "p1",
        patientName: "Sarah Johnson",
        cptCode: "72148",
        procedureDescription: "MRI Lumbar Spine without Contrast",
        payer: "Aetna",
        status: "complete",
        requestedAt: new Date().toISOString(),
        recommendation: "INSUFFICIENT_INFO",
        probabilityScore: 0.68,
        missingInfoCount: 3,
        completedAt: new Date().toISOString(),
      },
    ];
  }

  const res = await fetch(toUrl("/api/evaluate"));
  if (!res.ok) {
    throw new Error(await readError(res, "Failed to fetch evaluation runs"));
  }

  const rows = (await res.json()) as Array<{
    determination_id: string;
    patient_id: string;
    patient_name: string;
    cpt_code: string;
    procedure_description: string | null;
    payer: string;
    status: string;
    requested_at: string;
    recommendation: "LIKELY_APPROVED" | "LIKELY_DENIED" | "INSUFFICIENT_INFO" | null;
    probability_score: number | null;
    missing_info_count: number;
    completed_at: string | null;
  }>;

  return rows.map((row) => ({
    determinationId: row.determination_id,
    patientId: row.patient_id,
    patientName: row.patient_name,
    cptCode: row.cpt_code,
    procedureDescription: row.procedure_description,
    payer: row.payer,
    status: row.status,
    requestedAt: row.requested_at,
    recommendation: row.recommendation,
    probabilityScore: row.probability_score,
    missingInfoCount: row.missing_info_count,
    completedAt: row.completed_at,
  }));
}

export async function getEvaluationById(determinationId: string): Promise<EvaluationResult> {
  if (useMock) {
    await delay(300);
    return {
      ...MOCK_RESULT,
      determinationId,
    };
  }

  const res = await fetch(toUrl(`/api/evaluate/${determinationId}`));
  if (!res.ok) {
    throw new Error(await readError(res, "Failed to fetch evaluation details"));
  }

  const poll = (await res.json()) as {
    status: "pending" | "error" | "complete";
    message?: string;
    probability_score?: number;
    recommendation?: "LIKELY_APPROVED" | "LIKELY_DENIED" | "INSUFFICIENT_INFO";
    criteria_results?: Array<{
      reasoning?: string;
      evidence_quote?: string | null;
      policy_citation?: string;
      clinical_citation?: string | null;
    }>;
    missing_info?: string[];
  };

  if (poll.status === "pending") {
    throw new Error(poll.message || "Evaluation is still pending");
  }

  if (poll.status === "error") {
    throw new Error(poll.message || "Evaluation failed");
  }

  const verdict =
    poll.recommendation === "LIKELY_APPROVED"
      ? "YES"
      : poll.recommendation === "LIKELY_DENIED"
        ? "NO"
        : "MAYBE";

  return {
    determinationId,
    verdict,
    probability: Math.round((poll.probability_score ?? 0) * 100),
    reasons: poll.criteria_results
      ?.filter((c) => c.reasoning)
      .map((c) => ({
        reasoning: c.reasoning!,
        evidence: c.evidence_quote
          ? { text: c.evidence_quote, source: c.clinical_citation || c.policy_citation || "Clinical records" }
          : null,
      })) ?? [],
    missingInfo: poll.missing_info ?? [],
    evidence: [],
  };
}
