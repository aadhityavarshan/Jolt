# Jolt — Technical Design Document
## MVP Technical Specification

**Version:** 1.0
**Date:** 2026-02-21
**Context:** Georgia Tech Hacklytics 2026
**Approach:** Full-stack, developer-level build with Claude Code

---

## 1. Recommended Approach

**Full-stack monorepo** with a React frontend on Vercel and an Express backend on Railway, sharing a single Supabase project for both relational data and vector search. No microservices — one repo, one backend process, ship fast.

**Why this wins for a hackathon:**
- Supabase pgvector eliminates the need for a separate vector DB (Pinecone, Weaviate) — one database for everything
- Claude's native PDF support removes a parsing library dependency
- Railway + Vercel free tiers = $0 hosting cost
- shadcn/ui gives professional healthcare aesthetics out of the box

---

## 2. Alternative Options Considered

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Supabase + pgvector | Unified DB, free tier, pgvector built-in | Slightly slower than dedicated vector DBs | **CHOSEN** |
| Pinecone | Best-in-class vector search | Additional service, cost, complexity | Skip for MVP |
| OpenAI Assistants API | Managed RAG | Less control over retrieval logic, harder to demo | Skip |
| Vercel serverless for backend | Same host as frontend | Express needs refactoring, cold starts hurt <30s SLA | Use Railway |
| LangChain | RAG orchestration | Adds abstraction overhead, overkill for 2-stage pipeline | Skip, build directly |

---

## 3. Project Structure

```
jolt/
├── frontend/                    # React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # shadcn/ui components
│   │   │   ├── PatientSearch.tsx
│   │   │   ├── PatientDashboard.tsx
│   │   │   ├── DocumentUpload.tsx
│   │   │   ├── EvaluationRequest.tsx
│   │   │   ├── DeterminationView.tsx
│   │   │   └── PolicyAdmin.tsx
│   │   ├── pages/
│   │   │   ├── SearchPage.tsx
│   │   │   ├── PatientPage.tsx
│   │   │   ├── EvaluatePage.tsx
│   │   │   ├── DeterminationPage.tsx
│   │   │   └── AdminPage.tsx
│   │   ├── lib/
│   │   │   ├── api.ts           # Axios/fetch wrapper for backend calls
│   │   │   └── utils.ts         # shadcn utils
│   │   ├── types/
│   │   │   └── index.ts         # Shared TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── package.json
│
├── backend/                     # Node.js + Express
│   ├── src/
│   │   ├── routes/
│   │   │   ├── patients.ts      # GET /api/patients/search
│   │   │   ├── upload.ts        # POST /api/upload/clinical, /api/upload/policy
│   │   │   ├── evaluate.ts      # POST /api/evaluate
│   │   │   ├── cpt.ts           # GET /api/cpt/search
│   │   │   └── admin.ts         # GET /api/admin/policies
│   │   ├── services/
│   │   │   ├── pdfParser.ts     # Claude PDF parsing
│   │   │   ├── embedder.ts      # OpenAI embeddings
│   │   │   ├── chunker.ts       # Text chunking logic
│   │   │   ├── vectorStore.ts   # Supabase vector operations
│   │   │   └── ragPipeline.ts   # Two-stage RAG evaluation
│   │   ├── db/
│   │   │   └── supabase.ts      # Supabase client
│   │   ├── middleware/
│   │   │   └── upload.ts        # Multer config
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── app.ts               # Express app setup
│   ├── .env.example
│   └── package.json
│
├── docs/
│   ├── research-Jolt.txt
│   ├── PRD-Jolt-MVP.md
│   └── TechDesign-Jolt-MVP.md
├── CLAUDE.md
├── AGENTS.md
└── .gitignore
```

---

## 4. Database Schema

Run in Supabase SQL editor. Enable pgvector extension first.

```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Patients table
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dob DATE NOT NULL,
  mrn TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coverage / insurance
CREATE TABLE coverage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  payer TEXT NOT NULL,               -- e.g., "Aetna", "UnitedHealthcare"
  member_id TEXT,
  plan_name TEXT,
  group_number TEXT,
  effective_date DATE,
  termination_date DATE,
  is_active BOOLEAN DEFAULT TRUE
);

-- CPT code catalog
CREATE TABLE cpt_codes (
  code TEXT PRIMARY KEY,             -- e.g., "27447"
  description TEXT NOT NULL,
  category TEXT,
  common_payers TEXT[]               -- payers known to require PA for this code
);

-- Document chunks (unified for clinical + policy)
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding vector(1536),            -- OpenAI text-embedding-3-small dimensions
  metadata JSONB NOT NULL,           -- type, patient_id or payer, cpt_codes, etc.
  source_filename TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX ON document_chunks USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
CREATE INDEX ON document_chunks USING GIN (metadata);
CREATE INDEX ON patients (last_name, first_name);
CREATE INDEX ON patients (dob);

-- Prior auth requests
CREATE TABLE prior_auth_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  cpt_code TEXT REFERENCES cpt_codes(code),
  payer TEXT NOT NULL,
  status TEXT DEFAULT 'pending',     -- pending, complete, error
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Determinations
CREATE TABLE determinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES prior_auth_requests(id) ON DELETE CASCADE,
  probability_score FLOAT,           -- 0.0 - 1.0
  recommendation TEXT,               -- "LIKELY_APPROVED" | "LIKELY_DENIED" | "INSUFFICIENT_INFO"
  criteria_results JSONB,            -- array of { criterion, met, evidence, policy_citation, clinical_citation }
  missing_info TEXT[],               -- list of missing documentation items
  raw_response TEXT,                 -- Claude's full output for debugging
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Supabase RPC Function (vector similarity search with metadata filter)

```sql
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter jsonb
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_chunks.id,
    document_chunks.content,
    document_chunks.metadata,
    1 - (document_chunks.embedding <=> query_embedding) AS similarity
  FROM document_chunks
  WHERE
    document_chunks.metadata @> filter
    AND 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY document_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

## 5. API Routes

### Patients
```
GET  /api/patients/search?q={query}     -> Patient[] (name/DOB autocomplete)
GET  /api/patients/:id                  -> Patient + Coverage + Documents
```

### Upload
```
POST /api/upload/clinical               -> { patient_id, file } -> chunk + embed
POST /api/upload/policy                 -> { payer, cpt_codes[], file } -> chunk + embed
```

### Evaluate
```
POST /api/evaluate                      -> { patient_id, cpt_code, payer } -> determination_id
GET  /api/evaluate/:determination_id    -> Determination (for polling)
```

### CPT
```
GET  /api/cpt/search?q={query}          -> CptCode[] (autocomplete)
```

### Admin
```
GET  /api/admin/policies                -> list of uploaded policy documents
```

---

## 6. Feature Implementation

### 6.1 PDF Upload + Ingestion Pipeline

```typescript
// backend/src/services/pdfParser.ts
async function parsePdfWithClaude(fileBuffer: Buffer): Promise<string> {
  const base64 = fileBuffer.toString('base64');
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 8096,
    messages: [{
      role: 'user',
      content: [{
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: base64 }
      }, {
        type: 'text',
        text: 'Extract all text from this document. Preserve section headers and structure. Return only the extracted text.'
      }]
    }]
  });
  return response.content[0].text;
}
```

**Chunking strategy:**
- Clinical docs: 256-token chunks with 32-token overlap
- Policy docs: 512-token chunks with 64-token overlap (policy criteria need more context)
- Split on sentence boundaries, not word boundaries

**Metadata schema:**
```typescript
// Clinical chunk
{ type: "clinical", patient_id: string, record_type: string, date: string, source_filename: string }

// Policy chunk
{ type: "policy", payer: string, policy_id: string, cpt_codes: string[], section_header: string }
```

### 6.2 Two-Stage RAG Pipeline

```typescript
// Stage 1: Extract policy requirements
async function extractPolicyRequirements(payer: string, cptCode: string): Promise<string[]> {
  const queryEmbedding = await embed("prior authorization requirements criteria for " + cptCode);
  const policyChunks = await supabase.rpc('match_chunks', {
    query_embedding: queryEmbedding,
    match_threshold: 0.5,
    match_count: 10,
    filter: { type: 'policy', payer, cpt_codes: [cptCode] }
  });

  const criteriaResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Extract a numbered list of specific criteria required for prior authorization approval from these policy excerpts:\n\n${policyChunks.map(c => c.content).join('\n\n')}`
    }]
  });

  return parseCriteriaList(criteriaResponse.content[0].text);
}

// Stage 2: Match patient evidence against each criterion
async function evaluateEvidence(
  criteria: string[],
  patientId: string,
  policyChunks: Chunk[]
): Promise<CriterionResult[]> {
  const results: CriterionResult[] = [];

  for (const criterion of criteria) {
    const criterionEmbedding = await embed(criterion);
    const evidenceChunks = await supabase.rpc('match_chunks', {
      query_embedding: criterionEmbedding,
      match_threshold: 0.4,
      match_count: 5,
      filter: { type: 'clinical', patient_id: patientId }
    });

    const evalResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: buildEvaluationPrompt(criterion, evidenceChunks, policyChunks)
      }]
    });

    results.push(parseEvaluationResult(evalResponse.content[0].text, criterion, evidenceChunks));
  }

  return results;
}
```

**Evaluation prompt template:**
```
Criterion: {criterion}

Policy text (source of this requirement):
{policy_excerpt}

Patient clinical evidence:
{clinical_excerpts}

Determine if the patient meets this criterion. Respond in JSON:
{
  "met": boolean,
  "confidence": 0.0-1.0,
  "evidence_quote": "exact quote from clinical docs or null",
  "clinical_citation": "filename + approximate location or null",
  "policy_citation": "policy section/page reference",
  "reasoning": "brief explanation"
}

If evidence is insufficient, set met=false and explain what's missing.
Mark any claim without clinical evidence as [UNSUPPORTED].
```

### 6.3 Patient Search (Autocomplete)

```typescript
// backend/src/routes/patients.ts
router.get('/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return res.json([]);

  const { data } = await supabase
    .from('patients')
    .select('id, first_name, last_name, dob')
    .or(`last_name.ilike.${q}%,first_name.ilike.${q}%`)
    .limit(10);

  res.json(data);
});
```

### 6.4 CPT Code Search

Pre-seed the `cpt_codes` table with ~50 common PA procedures. Allow fuzzy search on code or description:

```typescript
router.get('/search', async (req, res) => {
  const q = String(req.query.q || '');
  const { data } = await supabase
    .from('cpt_codes')
    .select('code, description, category')
    .or(`code.ilike.%${q}%,description.ilike.%${q}%`)
    .limit(10);

  res.json(data);
});
```

---

## 7. Frontend Architecture

### Routing (React Router v6)
```
/                    -> SearchPage (patient search as landing)
/patient/:id         -> PatientPage (dashboard + docs)
/evaluate/:id        -> EvaluatePage (CPT selection + trigger)
/determination/:id   -> DeterminationPage (results)
/admin               -> AdminPage (policy upload + management)
```

### Key Components

**DeterminationView** — the money screen:
```
┌─────────────────────────────────────────────────────────┐
│  Aetna PA Evaluation — Total Knee Arthroplasty (27447)  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  Approval Probability: 72%  [████████░░]                │
│                                                         │
│  Criteria Checklist                                     │
│  ✓ Conservative therapy ≥6 months     [see evidence ↓] │
│  ✓ BMI < 40 documented                [see evidence ↓] │
│  ✗ HbA1c within 90 days              MISSING           │
│  ✗ Cardiology clearance               MISSING           │
│                                                         │
│  ⚠ Missing Information                                  │
│  • HbA1c result from past 90 days (Aetna CPB 0852 §3)  │
│  • Cardiologist clearance letter                        │
│                                                         │
│  Citations: [Aetna CPB 0852] [Clinical Notes 2/15/26]  │
└─────────────────────────────────────────────────────────┘
```

### State Management
- React Query (TanStack Query) for server state, caching, and background polling
- No Redux — too heavy for this scope
- Local component state for UI-only state (modals, form inputs)

### API Client
```typescript
// frontend/src/lib/api.ts
const BASE = import.meta.env.VITE_API_URL;

export const api = {
  patients: {
    search: (q: string) => fetch(`${BASE}/api/patients/search?q=${q}`).then(r => r.json()),
    get: (id: string) => fetch(`${BASE}/api/patients/${id}`).then(r => r.json()),
  },
  evaluate: {
    trigger: (body: EvaluateRequest) => fetch(`${BASE}/api/evaluate`, {
      method: 'POST', body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' }
    }).then(r => r.json()),
    get: (id: string) => fetch(`${BASE}/api/evaluate/${id}`).then(r => r.json()),
  },
  // ...
};
```

---

## 8. AI Assistance Strategy (Claude Code)

| Task | Approach |
|------|----------|
| Supabase schema setup | Paste SQL into Supabase editor manually — Claude drafts SQL |
| RAG pipeline | Claude writes service files; review logic before running |
| UI components | Claude Code + shadcn/ui CLI for component scaffolding |
| Synthea loader | Claude writes the bulk-load script from FHIR bundle spec |
| Evaluation prompt | Iterate with Claude; test on known policy+clinical pairs |
| Debugging | Paste error traces to Claude; use systematic debugging skill |

**Critical:** Tell Claude to write one service at a time. Don't ask for the whole backend at once. Test each route before moving on.

---

## 9. Deployment Plan

### Frontend → Vercel
```bash
# In /frontend
npm run build
# Connect GitHub repo to Vercel
# Set env: VITE_API_URL=https://your-railway-app.railway.app
```

### Backend → Railway
```bash
# Connect GitHub repo to Railway
# Set env variables (see .env.example)
# Railway auto-deploys from main branch
# Set start command: node dist/app.js (or ts-node src/app.ts for dev)
```

### Environment Variables

**Backend `.env`:**
```env
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...    # service role key (never expose to frontend)
PORT=3001
NODE_ENV=production
```

**Frontend `.env`:**
```env
VITE_API_URL=http://localhost:3001    # dev
# Production: set in Vercel dashboard
```

### Git Strategy (Feature Branches)
```
main          ← protected, always deployable
├── feat/db-schema
├── feat/upload-pipeline
├── feat/patient-search
├── feat/rag-evaluation
└── feat/determination-ui
```

Merge to main when feature is working end-to-end. Railway auto-deploys. Short-lived branches only — this is a hackathon.

---

## 10. Cost Breakdown

| Item | Development | Demo Day | Notes |
|------|-------------|----------|-------|
| Claude Sonnet API | ~$1-2 | ~$0.50 | PDF parsing + evaluation |
| OpenAI embeddings | ~$0.05 | ~$0.02 | text-embedding-3-small is very cheap |
| Supabase | $0 | $0 | Free tier: 500MB DB, 1GB storage |
| Railway | $0 | $0 | Free tier: $5 credit/month |
| Vercel | $0 | $0 | Free tier: unlimited for hobby |
| **Total** | **~$2-3** | **~$1** | Well within budget |

**Claude cost math:** ~$3 per million input tokens (Sonnet). A full evaluation uses ~5K tokens → $0.015/evaluation. 100 demo evaluations = $1.50.

---

## 11. Performance Targets & Implementation

| Metric | Target | Implementation |
|--------|--------|----------------|
| Patient search | <200ms | Postgres index on name/dob, no vector search |
| CPT search | <200ms | Postgres index, pre-seeded table |
| PDF ingestion | <10s | Claude native PDF → parallel chunk embedding |
| RAG evaluation | <30s | Parallel criterion evaluation where possible |
| Page load | <2s | Vite build, Vercel CDN |

**Parallelizing evaluation:** Instead of sequential per-criterion evaluation, batch criteria into groups and use `Promise.all()` for concurrent Claude calls. This cuts evaluation time significantly.

```typescript
// Evaluate multiple criteria in parallel
const results = await Promise.all(
  criteria.map(criterion => evaluateSingleCriterion(criterion, patientId, policyChunks))
);
```

---

## 12. Synthea Bulk Loader (P2)

```typescript
// backend/src/scripts/loadSynthea.ts
// Parse Synthea FHIR Bundle JSONs
// Extract: Patient demographics -> patients table
// Extract: Conditions, Observations, MedicationRequests -> text chunks -> embed -> store

async function loadPatientFromFHIR(bundle: FHIRBundle) {
  const patient = bundle.entry.find(e => e.resource.resourceType === 'Patient').resource;
  const conditions = bundle.entry.filter(e => e.resource.resourceType === 'Condition');
  const observations = bundle.entry.filter(e => e.resource.resourceType === 'Observation');

  // Insert patient record
  const { data: patientRecord } = await supabase.from('patients').insert({
    first_name: patient.name[0].given[0],
    last_name: patient.name[0].family,
    dob: patient.birthDate,
    mrn: patient.id
  }).select().single();

  // Convert clinical resources to text -> chunk -> embed -> store
  const clinicalText = buildClinicalNarrative(conditions, observations);
  await ingestClinicalText(clinicalText, patientRecord.id, 'synthea-fhir');
}
```

Run: `npx ts-node backend/src/scripts/loadSynthea.ts ./data/synthea/`

---

## 13. Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| No real-time evaluation streaming | Determination appears all at once after <30s | Show loading state with step indicators |
| Claude PDF limit ~100 pages | Very long policies may fail | Fallback to pdf-parse library; warn user |
| Supabase free tier row limits | Fine for demo, not production scale | Document upgrade path |
| No auth | Anyone can access all data | OK — synthetic data only; document this |
| pgvector HNSW vs exact search | May miss edge cases | Match threshold tuning during testing |
| OpenAI embeddings are external | Another API dependency | Cache embeddings; they're cheap to regenerate |

---

## 14. Definition of Done

Match the PRD launch checklist:

- [ ] Supabase schema deployed + RPC function working
- [ ] `POST /api/upload/clinical` ingests PDF end-to-end
- [ ] `POST /api/upload/policy` ingests PDF with CPT metadata
- [ ] `GET /api/patients/search` returns results in <200ms
- [ ] `GET /api/cpt/search` returns results in <200ms
- [ ] `POST /api/evaluate` returns determination in <30s
- [ ] Determination includes per-criterion checklist with citations
- [ ] Missing information is surfaced in output
- [ ] Synthea patients loaded (50+ patients)
- [ ] Real Aetna/CMS policy PDFs uploaded and indexed
- [ ] All 5 demo moments work end-to-end
- [ ] Frontend deployed to Vercel public URL
- [ ] Backend deployed to Railway
- [ ] No API keys exposed in frontend bundle

---

## Scaling Path (Post-Hackathon)

| Scale | Action |
|-------|--------|
| 100 users | Stay on Supabase free tier; Railway hobby plan |
| 1,000 users | Supabase Pro ($25/mo); add job queue (BullMQ) for async PDF processing |
| 10,000 users | Dedicated Postgres + pgvector; Redis cache for embeddings; horizontal scale backend |
| Production | Add auth (Supabase Auth + RLS), HIPAA BAA with Supabase, SafetyKit PHI redaction |
