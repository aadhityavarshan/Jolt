# Product Requirements — Jolt

## P1 — Must Have (MVP)

### 1. Clinical PDF Upload
- User uploads a PDF of patient clinical documents (lab reports, notes, imaging)
- Backend: receives file via `POST /api/upload/clinical` with `patient_id` and `file`
- Pipeline: Claude extracts text → chunk at 256 tokens / 32 overlap → OpenAI embed → store in `document_chunks`
- Chunk metadata: `{ type: "clinical", patient_id, record_type, date, source_filename }`
- **Success:** Uploaded PDF is parsed, chunked, embedded, and retrievable by `patient_id` in <10 seconds

### 2. Policy PDF Upload
- User uploads an insurance policy PDF (e.g., Aetna Clinical Policy Bulletin for knee replacement)
- Backend: receives via `POST /api/upload/policy` with `payer`, `cpt_codes[]`, and `file`
- Pipeline: Claude extracts text → chunk at 512 tokens / 64 overlap → embed → store
- Chunk metadata: `{ type: "policy", payer, policy_id, cpt_codes, section_header }`
- **Success:** Uploaded policy is stored with correct CPT codes as filterable metadata

### 3. CPT Code Catalog
- Searchable list of CPT/HCPCS codes with code, description, and category
- Pre-seeded with ~50 common PA procedures (knee replacement, MRI, cardiac, etc.)
- `GET /api/cpt/search?q=` returns matching codes
- **Success:** Autocomplete returns results in <200ms

### 4. Patient Search with Autocomplete
- `GET /api/patients/search?q=` searches by last name or first name (prefix match)
- Returns patient id, name, DOB
- `GET /api/patients/:id` returns patient + coverage + list of clinical documents
- **Success:** Search returns results in <200ms; displays patient with coverage info

### 5. RAG Evaluation
- `POST /api/evaluate` accepts `{ patient_id, cpt_code, payer }`
- Stage 1: Vector search policy chunks filtered by `payer` + `cpt_code` → Claude extracts criteria list
- Stage 2: For each criterion, vector search clinical chunks filtered by `patient_id` → Claude evaluates evidence
- Criteria evaluated in parallel using `Promise.all()`
- `GET /api/evaluate/:determination_id` for polling the result
- **Success:** Full evaluation completes in <30 seconds

### 6. Determination Output
- Probability score (0.0–1.0)
- Per-criterion breakdown: `{ criterion, met, evidence_quote, clinical_citation, policy_citation, reasoning }`
- Recommendation: `LIKELY_APPROVED` | `LIKELY_DENIED` | `INSUFFICIENT_INFO`
- Missing information list: plain-language items with policy reference
- Every claim has a citation; uncited claims marked `[UNSUPPORTED]`
- **Success:** All 5 demo moments work; judges can verify every citation

---

## P2 — Should Have

### Synthea Bulk Loader
- Script: `backend/src/scripts/loadSynthea.ts`
- Parses Synthea FHIR Bundle JSONs
- Inserts patient demographics → `patients` table
- Converts conditions/observations to text → chunks → embeds → stores in `document_chunks`
- Target: 50+ synthetic patients loaded for demo

### Interactive Criteria Checklist
- Visual green/red checkmarks per criterion
- Expandable row showing evidence quote and policy text side by side
- Displayed in DeterminationPage

### Auto-Generated Letter of Medical Necessity
- Claude generates a formal approval letter citing clinical evidence
- Exportable as plain text

---

## P3 — Could Have (only if time permits)

### Multi-Payer Comparison
- Run evaluation against two payers simultaneously
- Display side-by-side results

### Determination History
- Store past evaluations per patient
- Show timeline of PA outcomes

---

## Won't Have (v1)

- Real EHR integration (SMART on FHIR launch context)
- Real payer submission (X12 278 EDI transactions)
- User authentication or multi-tenancy
- PHI/PII redaction (SafetyKit)
- Real-time streaming of determination output

---

## Performance Targets

| Feature | Target |
|---------|--------|
| Patient search | <200ms |
| CPT code search | <200ms |
| PDF ingestion | <10s |
| RAG evaluation | <30s |
| Page load | <2s |

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `patients` | Demographics (name, DOB, MRN) |
| `coverage` | Insurance info per patient (payer, member_id, active) |
| `cpt_codes` | Procedure catalog (code, description, category) |
| `document_chunks` | All chunks (clinical + policy) with embeddings + metadata |
| `prior_auth_requests` | Evaluation requests (patient, CPT, payer, status) |
| `determinations` | Results (score, criteria_results, missing_info) |

---

## API Routes Summary

```
GET  /api/patients/search?q=            Patient autocomplete
GET  /api/patients/:id                  Patient detail + coverage + docs
POST /api/upload/clinical               Upload + ingest clinical PDF
POST /api/upload/policy                 Upload + ingest policy PDF
GET  /api/cpt/search?q=                 CPT code autocomplete
POST /api/evaluate                      Trigger RAG evaluation
GET  /api/evaluate/:determination_id    Poll for determination result
GET  /api/admin/policies                List uploaded policy documents
```
