# GitHub Copilot Instructions for Jolt

## Project Overview

**Jolt** is an AI-powered prior authorization tool built for Georgia Tech Hacklytics 2026.
Physicians upload clinical and policy PDFs. The system uses RAG (two-stage retrieval) to evaluate PA requests against payer requirements and returns a determination with citations in <30 seconds.

**Stack:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui | Node.js + Express | Anthropic Claude Sonnet | OpenAI text-embedding-3-small | Supabase (Postgres + pgvector)

---

## Key Architectural Decisions

- **Single vector table** (`document_chunks`) stores both clinical and policy content, differentiated by `metadata.type`
- **Two-stage RAG:** Stage 1 retrieves policy requirements; Stage 2 finds patient evidence for each criterion
- **No LangChain** — pipeline is built directly with Supabase RPC (`match_chunks`) + Anthropic SDK
- **No Redux** — TanStack Query for all server state
- **No auth** — synthetic data demo only

---

## File Structure

```
jolt/
├── frontend/src/
│   ├── components/    # PatientSearch, DocumentUpload, DeterminationView, etc.
│   ├── pages/         # SearchPage, PatientPage, EvaluatePage, DeterminationPage, AdminPage
│   ├── lib/api.ts     # Backend fetch wrapper
│   └── types/index.ts # Shared TS types
├── backend/src/
│   ├── routes/        # patients.ts, upload.ts, evaluate.ts, cpt.ts, admin.ts
│   ├── services/      # pdfParser.ts, embedder.ts, chunker.ts, vectorStore.ts, ragPipeline.ts
│   ├── db/supabase.ts # Supabase client
│   └── app.ts         # Express entry point
└── agent_docs/        # Reference docs for tech stack, patterns, testing
```

---

## Coding Conventions

- TypeScript strict mode — no implicit `any`
- Async/await everywhere — no raw Promise chains
- Zod for request validation in Express routes
- shadcn/ui for all UI components — do not invent custom components when shadcn has one
- Error responses: `{ error: string, code?: string }` with appropriate HTTP status
- Environment variables: never hardcode, always use `process.env` (backend) or `import.meta.env` (frontend)

---

## Chunk Metadata Shape

```typescript
// Clinical document chunk
{ type: "clinical", patient_id: string, record_type: string, date: string, source_filename: string }

// Policy document chunk
{ type: "policy", payer: string, policy_id: string, cpt_codes: string[], section_header: string }
```

---

## Critical Rules

- `SUPABASE_SERVICE_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` are backend-only — never reference them in frontend code
- Clinical chunks: 256-token max with 32-token overlap
- Policy chunks: 512-token max with 64-token overlap
- Use `Promise.all()` to evaluate criteria in parallel — not sequentially
- Always check `AGENTS.md` for current phase before adding new features
