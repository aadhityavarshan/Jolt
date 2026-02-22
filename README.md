# Jolt

> **AI-powered Prior Authorization, in seconds.**

Prior authorization is one of the biggest bottlenecks in modern healthcare — a process that takes 7–14 days, buries clinical staff in paperwork, and delays patient care. Jolt eliminates that friction by combining patient data, clinical documents, and insurance policy requirements into a single AI-driven decision in under 30 seconds.

Built at **Hacklytics 2026** — Georgia Tech's annual data science hackathon.

https://jolt-gray.vercel.app/

---

## How It Works

```
Patient Search → Coverage Verification → Procedure Selection → AI Evaluation → Decision Report
```

1. **Search** — Look up a patient by name with real-time autocomplete. Patients are sorted by most recent evaluation so active cases surface first.
2. **Profile** — See demographics, active insurance coverage, and all uploaded clinical documents in one view.
3. **Select Procedure** — Pick a CPT code (with optional laterality) from a searchable catalog.
4. **Evaluate** — Jolt's RAG pipeline cross-references the patient's clinical records against the payer's policy requirements using Claude AI.
5. **Decision** — Get a structured report: Likely Approved / Uncertain / Likely Denied, an approval probability score, supporting evidence, and a list of missing information — each with a direct upload button.

---

## Features

### Patient Management
- **Real-time patient search** — Autocomplete by first or last name, sorted by most recent evaluation
- **Coverage verification** — Active insurance plans, payer name, plan type, and member ID at a glance
- **Clinical document viewer** — Browse and read uploaded medical records linked to each patient
- **Evaluation history** — See past prior auth runs per patient with outcomes and timestamps

### AI Evaluation
- **RAG pipeline** — Policy documents and clinical records are chunked, embedded (VoyageAI), and stored in Supabase with pgvector for semantic retrieval
- **Claude-powered analysis** — Each payer policy criterion is evaluated in parallel against the patient's evidence
- **Evidence citations** — Every reason links back to the exact source quote from clinical records or policy documents
- **Approval probability score** — A 0–100% confidence score alongside the qualitative verdict
- **Missing info detection** — Surfaces exactly what documentation is still needed, with inline upload buttons to resolve each item

### Document Handling
- **Clinical document upload** — Drag-and-drop PDF or image upload, chunked and embedded automatically
- **Policy document upload** — Upload payer-specific policy PDFs indexed by CPT code
- **Letter of Medical Necessity** — Generate and download a pre-filled PDF letter for any completed evaluation

### Evaluation History
- **Full audit trail** — Every prior auth run is stored with patient, payer, CPT, timestamps, and outcome
- **Filter & search** — Filter history by status, recommendation, or patient name
- **Drill-down view** — Click any historical run to see the full decision report

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query, Framer Motion |
| **Backend** | Node.js, Express 5, TypeScript |
| **Database** | Supabase (PostgreSQL + pgvector) |
| **AI / LLM** | Anthropic Claude (evaluation reasoning) |
| **Embeddings** | VoyageAI (`voyage-3`) |
| **File Uploads** | Multer |
| **Validation** | Zod |

---

## Project Structure

```
Jolt/
├── backend/
│   └── src/
│       ├── app.ts                    # Express server entry point
│       ├── db/
│       │   └── supabase.ts           # Supabase client
│       ├── routes/
│       │   ├── patients.ts           # Patient search, profile & document endpoints
│       │   ├── evaluate.ts           # Prior auth evaluation & polling endpoints
│       │   ├── cpt.ts                # CPT code search
│       │   └── upload.ts             # Clinical & policy document upload
│       └── services/
│           └── ragPipeline.ts        # RAG evaluation pipeline (chunking, embedding, retrieval)
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── EvaluateResults.tsx   # Decision report with evidence, missing info & upload sheet
│       │   ├── CptSearch.tsx         # Procedure search with laterality toggles
│       │   ├── AnatomyHighlighter.tsx # Body diagram for procedure visualization
│       │   └── ui/                   # shadcn/ui component library
│       ├── pages/
│       │   ├── LandingPage.tsx       # Marketing / entry page
│       │   ├── MainPage.tsx          # Patient browser & evaluation launcher
│       │   ├── EvaluationResultPage.tsx # Decision report + evaluation history
│       │   └── AdminPage.tsx         # Document upload management
│       └── lib/
│           ├── api.ts                # Typed API client (with mock mode)
│           ├── types.ts              # Shared TypeScript interfaces
│           ├── reasonCategories.ts   # Reason categorization logic
│           └── procedureDescriptions.ts # CPT code descriptions
├── docs/                             # PRD, Tech Design, Research
├── agent_docs/                       # Detailed reference docs per feature area
├── AGENTS.md                         # Build phase tracker
└── CLAUDE.md                         # Claude Code configuration
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project with `patients`, `coverage`, `document_chunks`, and `prior_auth_requests` tables
- API keys for Anthropic, VoyageAI, and OpenAI

### 1. Backend

```bash
cd backend
npm install
```

Create a `.env` file:

```env
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key
VOYAGE_API_KEY=your_voyage_key
```

Start the dev server:

```bash
npm run dev
```

Backend runs at `http://localhost:3001`.

### 2. Frontend

```bash
cd frontend
npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:3001
```

Start the dev server:

```bash
npm run dev
```

Frontend runs at `http://localhost:5173` (or the next available port).

---

## API Reference

### Patients

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/patients` | List all patients (max 500), ordered by name |
| `GET` | `/api/patients/search?q=<name>` | Autocomplete patient search (max 10 results) |
| `GET` | `/api/patients/:id` | Full patient record — demographics, coverage, documents |
| `GET` | `/api/patients/:id/documents/:filename` | Full text content of a clinical document |

### Evaluation

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/evaluate` | Trigger a prior auth evaluation (returns `determination_id`) |
| `GET` | `/api/evaluate` | List all evaluation runs (most recent first) |
| `GET` | `/api/evaluate/:id` | Poll for evaluation result — returns `pending`, `complete`, or `error` |
| `POST` | `/api/evaluate/:id/letter` | Generate and download a PDF Letter of Medical Necessity |

### Procedures & Uploads

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/cpt/search?q=<query>` | Search CPT codes by code or description |
| `POST` | `/api/upload/clinical` | Upload a clinical document PDF for a patient |
| `POST` | `/api/upload/policy` | Upload an insurance policy PDF indexed by payer + CPT |
| `GET` | `/api/health` | Health check |

---

## Team

Built in 36 hours at **Hacklytics 2026** — Georgia Tech's annual data science hackathon.
