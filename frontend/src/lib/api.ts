import type {
  Patient,
  Procedure,
  EvaluateRequest,
  EvaluationResult,
} from "./types";

let useMock = false;

export const isMockMode = () => useMock;
export const setMockMode = (v: boolean) => { useMock = v; };

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
  determinationId: "mock-determination-id",
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
  const res = await fetch(toUrl(`/api/patients/search?q=${encodeURIComponent(query)}`));
  if (!res.ok) {
    throw new Error(await readError(res, "Failed to search patients"));
  }
  const rows = await res.json() as Array<{
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
    return MOCK_PROCEDURES.filter(
      (p) => p.label.toLowerCase().includes(q) || p.cptCode.includes(q)
    );
  }
  const res = await fetch(toUrl(`/api/cpt/search?q=${encodeURIComponent(query)}`));
  if (!res.ok) {
    throw new Error(await readError(res, "Failed to search procedures"));
  }
  const rows = await res.json() as Array<{
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

  const trigger = await triggerRes.json() as { determination_id: string };
  const timeoutMs = 35_000;
  const intervalMs = 1_200;
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    await delay(intervalMs);
    const pollRes = await fetch(toUrl(`/api/evaluate/${trigger.determination_id}`));
    if (!pollRes.ok) {
      throw new Error(await readError(pollRes, "Failed to poll evaluation"));
    }
    const poll = await pollRes.json() as {
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
        reasons:
          poll.criteria_results?.map((c) => c.reasoning).filter((v): v is string => Boolean(v)) ?? [],
        missingInfo: poll.missing_info ?? [],
        evidence:
          poll.criteria_results
            ?.filter((c) => c.evidence_quote)
            .map((c) => ({
              text: c.evidence_quote as string,
              source: c.clinical_citation || c.policy_citation || "Clinical records",
            })) ?? [],
      };
    }
  }

  throw new Error("Evaluation timed out after 35 seconds");
}

export async function uploadClinical(
  patientId: string,
  recordType: string,
  date: string,
  file: File
): Promise<void> {
  if (useMock) {
    await delay(1000);
    return;
  }
  const fd = new FormData();
  fd.append("patient_id", patientId);
  fd.append("record_type", recordType);
  fd.append("date", date);
  fd.append("file", file);
  const res = await fetch(toUrl("/api/upload/clinical"), { method: "POST", body: fd });
  if (!res.ok) {
    throw new Error(await readError(res, "Clinical upload failed"));
  }
}

export async function uploadPolicy(
  payer: string,
  cptCodes: string[],
  policyId: string,
  file: File
): Promise<void> {
  if (useMock) {
    await delay(1000);
    return;
  }
  const fd = new FormData();
  fd.append("payer", payer);
  fd.append("cpt_codes", cptCodes.join(","));
  fd.append("policy_id", policyId);
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
