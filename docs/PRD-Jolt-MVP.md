# Jolt — Intelligent Prior Authorization
## Product Requirements Document (MVP)

**Version:** 1.0
**Date:** 2026-02-20
**Context:** Georgia Tech Hacklytics 2026 + Portfolio Piece

---

## 1. Product Overview

**Name:** Jolt
**Tagline:** Prior authorization in seconds, not days.
**Goal:** Win Hacklytics 2026 and serve as a strong portfolio piece demonstrating AI-powered healthcare automation.
**Timeline:** Hacklytics weekend (~12-16 hours build time)

Jolt is an AI-powered prior authorization tool that uses RAG (Retrieval-Augmented Generation) to evaluate PA requests against insurance policy requirements in real time. Physicians and clinical staff upload clinical and policy PDFs independently. When a PA evaluation is triggered, the system extracts payer-specific requirements from policy documents and matches them against the patient's clinical evidence — delivering a determination with citations in under 30 seconds.

---

## 2. Target Users

### Primary Persona: Physician
- Spends ~12 minutes per prior authorization request
- 88% report "high" PA burden (AMA 2023)
- 34% report patient adverse events linked to PA delays
- Needs fast, explainable determinations with policy citations

### Secondary Persona: Clinical Staff
- Spends ~45 minutes per PA on administrative tasks
- Manually reviews policy documents to identify requirements
- Frequently submits incomplete requests due to unclear criteria
- Needs clear guidance on what documentation is missing

### Jobs to Be Done
- Quickly determine if a procedure will be approved by a specific payer
- Identify exactly what clinical evidence is needed before submission
- Reduce time spent reading and cross-referencing policy documents
- Avoid adverse patient outcomes caused by PA delays

---

## 3. Problem Statement

Prior authorization is the most burdensome administrative process in US healthcare. It costs ~$31 billion/year, takes 1-14 days per request, and requires physicians and staff to manually cross-reference clinical documentation against insurance policy criteria. 35+ million PAs are processed annually, each costing $11-15 on the provider side.

The core problem: clinicians are manually doing what an AI can do in seconds — reading policy documents, extracting requirements, matching patient evidence against criteria, and identifying gaps.

Jolt solves this by automating the evaluation step: upload your documents, select a patient and procedure, and get an instant, cited determination.

---

## 4. User Journey

### Document Upload Flow (Independent)
1. Staff uploads insurance policy PDFs (e.g., Aetna CPB for knee replacement)
2. System parses PDF via Claude, chunks content, generates embeddings, stores in vector DB with payer/CPT metadata
3. Staff uploads clinical PDFs for a patient (lab reports, clinical notes, imaging)
4. System parses, chunks, embeds, stores with patient_id metadata
5. Documents are now in the system's library, ready for evaluation

### Evaluation Flow
1. Physician searches for patient by name/DOB (autocomplete)
2. Selects the patient, sees their uploaded clinical documents and insurance coverage
3. Selects procedure via CPT code search (e.g., 27447 — Total Knee Arthroplasty)
4. Hits "Evaluate"
5. System retrieves payer requirements (policy chunks filtered by payer + CPT code)
6. System retrieves patient evidence (clinical chunks filtered by patient_id)
7. Claude compares evidence against each requirement criterion
8. Determination displayed: criteria checklist (met/unmet), probability score, citations to both policy and clinical documents, and missing information callout
9. Physician sees: "Aetna requires X, Y, Z — patient meets X and Y, missing Z (HbA1c from past 90 days)"

---

## 5. MVP Features

### Must Have (P1)

**1. Clinical PDF Upload**
- *User Story:* As a physician, I want to upload clinical documents for a patient so that the system can use them during PA evaluation.
- *Details:* Upload PDF -> Claude parses -> chunk into 256-token segments -> embed via OpenAI -> store in document_chunks with `{ type: "clinical", patient_id, record_type, date, source_filename }` metadata
- *Success Criteria:* Uploaded PDF is parsed, chunked, embedded, and retrievable by patient_id within 10 seconds

**2. Policy PDF Upload**
- *User Story:* As clinical staff, I want to upload insurance policy PDFs so that the system knows each payer's requirements.
- *Details:* Upload PDF -> Claude parses -> chunk into 512-token segments -> embed -> store with `{ type: "policy", payer, policy_id, cpt_codes, section_header }` metadata
- *Success Criteria:* Uploaded policy is parsed with correct CPT codes extracted and stored as filterable metadata

**3. CPT Code Catalog**
- *User Story:* As a physician, I want to search and select a procedure code so that I can trigger an evaluation for the right procedure.
- *Details:* Searchable list of CPT/HCPCS codes with code, description, and category. Seeded with 20-50 common procedures relevant to PA. Codes also extracted from ingested policy PDFs.
- *Success Criteria:* Autocomplete search returns matching CPT codes in <200ms

**4. Patient Search with Autocomplete**
- *User Story:* As a physician, I want to search for a patient by name or DOB so that I can quickly pull up their record.
- *Details:* Relational lookup against patients table, autocomplete UI. Displays patient info, coverage/insurance, and list of uploaded clinical documents.
- *Success Criteria:* Search returns results in <200ms, displays patient with coverage info

**5. RAG Evaluation**
- *User Story:* As a physician, I want to evaluate a PA request and get an instant determination so that I don't spend 57 minutes per authorization.
- *Details:* Two-stage RAG pipeline:
  - Stage 1: Filter policy chunks by payer + CPT code -> extract requirements/criteria checklist
  - Stage 2: Filter patient clinical chunks by patient_id -> semantic search for evidence matching each criterion
  - Claude compares evidence vs. criteria -> structured determination
- *Success Criteria:* Full evaluation completes in <30 seconds

**6. Determination Output with Citations & Missing Info Detection**
- *User Story:* As clinical staff, I want to see exactly which criteria are met, which are missing, and where the evidence comes from so that I can act on the determination.
- *Details:* Display includes:
  - Probability score (0-1)
  - Per-criterion breakdown (met/unmet with evidence quotes)
  - Inline citations referencing specific policy and clinical document chunks with page numbers
  - Missing information callout ("You need HbA1c from past 90 days per Aetna CPB 0852")
- *Success Criteria:* Every claim has a verifiable citation, uncited claims flagged as [UNSUPPORTED]

### Should Have (P2)

**1. Synthea Bulk Loader**
- Pre-populate the system with 50-100 synthetic patients for demo purposes
- Parse Synthea FHIR bundles -> insert demographics into patients table -> convert clinical data to text chunks -> embed and store

**2. Interactive Criteria Checklist**
- Visual green/red display per criterion showing met vs. unmet
- Expandable to show the source evidence and policy text side by side

**3. Auto-Generated Letter of Medical Necessity**
- Claude generates a formal letter citing the clinical evidence that supports approval
- Exportable as text for real-world use

### Could Have (P3)

**1. Multi-Payer Comparison**
- Run evaluation against multiple payers simultaneously
- "Would both Aetna AND UHC approve this knee replacement?"

**2. Determination History / Audit Trail**
- Store and display past PA evaluations per patient
- Track approval rates and common denial reasons

### Won't Have (v1)

- Real EHR integration (SMART on FHIR launch)
- Actual payer submission (X12 278 transactions)
- User authentication / multi-tenant support
- SafetyKit PHI/PII redaction

---

## 6. Success Metrics

| Metric | Target |
|--------|--------|
| **Activation** | Judge completes a full PA evaluation from search to determination in <2 minutes |
| **Performance** | RAG evaluation returns determination in <30 seconds |
| **Accuracy** | 100% of determination claims have verifiable citations |
| **Demo Impact** | All 5 demo moments land (search, upload, determination, missing info, business case) |
| **Portfolio** | Visitors spend 3+ minutes exploring the live demo |
| **Business Case** | Demonstrates cost reduction from $11-15 manual to <$1 per PA |

---

## 7. Design Direction

- **Visual Style:** Clean, professional, clinical — not playful. Think healthcare SaaS.
- **Key Screens:**
  1. Document Upload — drag-and-drop PDF upload for clinical and policy docs
  2. Patient Search — autocomplete search bar, patient cards with coverage info
  3. Patient Dashboard — uploaded documents list, insurance details
  4. Evaluation Request — patient + CPT code selection, "Evaluate" button
  5. Determination View — criteria checklist, probability score, citations, missing info
  6. Admin/Policy Management — upload and manage insurance policy PDFs
- **Framework:** React + Vite + Tailwind CSS + shadcn/ui
- **Responsive:** Desktop-first (judges use laptops), basic mobile support

---

## 8. Technical Considerations

### Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind + shadcn/ui |
| Backend | Node.js + Express |
| LLM | Anthropic Claude Sonnet (generation + PDF parsing) |
| Embeddings | OpenAI text-embedding-3-small (1536 dimensions) |
| Database | Supabase (Postgres + pgvector + Auth) |
| File Uploads | Multer |
| Validation | Zod |

### Architecture
- Hybrid database: relational tables for patient/coverage lookup, vector table for semantic search across all documents
- Single `document_chunks` table serves both clinical and policy documents, differentiated by metadata
- HNSW index on embeddings for fast similarity search
- GIN index on metadata JSONB for fast filtering
- Combined metadata filter + vector similarity search via Supabase RPC function

### Performance
- Patient search autocomplete: <200ms (relational index)
- RAG evaluation: <30 seconds end-to-end
- PDF parsing: handled by Claude native PDF support (up to ~100 pages)
- Fallback: pdf-parse for documents exceeding Claude's limit

### Security
- Synthetic data only — no real PHI
- API keys stored server-side in environment variables
- No exposed credentials in frontend

---

## 9. Constraints

| Constraint | Details |
|-----------|---------|
| **Budget** | ~$2-5 total (Claude API ~$2-5, OpenAI embeddings ~$0.10) |
| **Timeline** | Hacklytics weekend, ~12-16 hours build time |
| **Data** | 5-10 real Aetna/CMS policy PDFs + Synthea synthetic patients |
| **Team** | Georgia Tech Hacklytics team |
| **Platform** | Web only, desktop-optimized |
| **Compliance** | Not required (synthetic data), but architecture demonstrates HIPAA awareness |

---

## 10. Definition of Done — Launch Checklist

- [ ] Supabase schema deployed (patients, coverage, document_chunks, prior_auth_requests, determinations, cpt_codes)
- [ ] Policy PDF upload ingests, parses, chunks, embeds, and stores with correct metadata
- [ ] Clinical PDF upload ingests, parses, chunks, embeds, and stores with patient_id
- [ ] CPT code catalog is searchable
- [ ] Patient search returns results with autocomplete
- [ ] RAG evaluation produces determination with per-criterion breakdown in <30 seconds
- [ ] Citations are verifiable and trace to specific document chunks
- [ ] Missing information is detected and surfaced
- [ ] Demo data loaded (Synthea patients + real policy PDFs)
- [ ] 5 demo moments rehearsed and working end-to-end
- [ ] Deployed to a public URL (Vercel) for judges

---

## Appendix: Five Demo Moments That Win

1. **The Search:** Type "John Smith" -> patient record + uploaded docs appear instantly
2. **The Upload:** Upload clinical notes PDF -> parsed and indexed in seconds
3. **The Determination:** Select procedure, hit Evaluate -> AI determination in <30 seconds
4. **The Missing Info Catch:** "You need HbA1c from past 90 days per Aetna CPB 0852"
5. **The Business Case:** "This saved 45 min and $14. At scale: $140K/year savings for a mid-size practice"
