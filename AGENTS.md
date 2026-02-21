# AGENTS.md — Master Plan for Jolt

**App:** Jolt — AI-powered Prior Authorization
**Tagline:** Prior authorization in seconds, not days.
**Stack:** React 18 + TypeScript + Vite + Tailwind + shadcn/ui | Node.js + Express | Claude Sonnet | OpenAI embeddings | Supabase (Postgres + pgvector)
**Deployment:** Vercel (frontend) + Railway (backend)
**Context:** Georgia Tech Hacklytics 2026 — 12-16 hour build

---

## How to Think

1. **Read context files before coding.** Load from `agent_docs/` when you need specifics on tech, patterns, or requirements.
2. **Plan before coding.** Propose your approach, list the files you'll touch, then wait for a thumbs-up before starting.
3. **One feature at a time.** Build a route → test it → then move on. Don't skip ahead.
4. **Explain trade-offs.** When there are multiple valid approaches, say so. Don't pick silently.
5. **Verify after changes.** Run the relevant test or curl command after each feature to confirm it works.
6. **Be concise.** The user is in-between dev and vibe-coder. Give guidance without overwhelming.

---

## Plan → Execute → Verify Loop

For every feature:
1. **Plan:** List what files will be created or changed. Get approval.
2. **Execute:** Write the code, one file at a time.
3. **Verify:** Run the check command or ask the user to test.

---

## Context Files (load when needed)

| File | Use When |
|------|----------|
| `agent_docs/tech_stack.md` | You need library versions, setup commands, or configuration details |
| `agent_docs/code_patterns.md` | You need naming conventions, file structure, or error handling patterns |
| `agent_docs/project_brief.md` | You need product vision, quality gates, or key commands |
| `agent_docs/product_requirements.md` | You need to verify a feature matches the PRD |
| `agent_docs/testing.md` | You need to write tests or verify a feature end-to-end |

---

## Current State

**Last Updated:** 2026-02-21
**Current Phase:** Phase 1 — Foundation
**Working On:** Not started
**Recently Completed:** None
**Blocked By:** None

---

## Roadmap

### Phase 1: Foundation
- [ ] Initialize monorepo structure (`/frontend`, `/backend`)
- [ ] Setup `frontend` — Vite + React + TypeScript + Tailwind + shadcn/ui
- [ ] Setup `backend` — Node.js + Express + TypeScript
- [ ] Configure Supabase client in backend
- [ ] Deploy Supabase schema (patients, coverage, cpt_codes, document_chunks, prior_auth_requests, determinations)
- [ ] Deploy `match_chunks` RPC function in Supabase
- [ ] Create HNSW + GIN indexes
- [ ] Seed CPT code catalog (~50 common PA procedures)
- [ ] Configure `.env` files for backend and frontend
- [ ] Verify Supabase connection works (simple read query)

### Phase 2: Upload Pipeline
- [ ] `POST /api/upload/clinical` — accept PDF, parse with Claude, chunk, embed, store
- [ ] `POST /api/upload/policy` — accept PDF + payer/CPT metadata, parse, chunk, embed, store
- [ ] Frontend: DocumentUpload component with drag-and-drop (clinical and policy tabs)
- [ ] Frontend: AdminPage for policy management (`/admin`)
- [ ] End-to-end test: upload a policy PDF → verify chunks appear in Supabase

### Phase 3: Patient & CPT Search
- [ ] `GET /api/patients/search?q=` — autocomplete by name/DOB
- [ ] `GET /api/patients/:id` — patient detail with coverage + document list
- [ ] `GET /api/cpt/search?q=` — autocomplete by code or description
- [ ] Frontend: PatientSearch component with autocomplete
- [ ] Frontend: PatientPage with uploaded docs list and coverage info
- [ ] Frontend: EvaluatePage with CPT code autocomplete
- [ ] Load Synthea synthetic patients (50+ patients) via bulk loader script

### Phase 4: RAG Evaluation
- [ ] `POST /api/evaluate` — trigger two-stage RAG pipeline
- [ ] Stage 1: Extract policy requirements via vector search + Claude
- [ ] Stage 2: Evaluate each criterion against patient evidence in parallel
- [ ] `GET /api/evaluate/:determination_id` — poll for result
- [ ] Structured determination output: probability score, criteria results, citations, missing info
- [ ] Frontend: DeterminationPage with criteria checklist, score, citations, missing info callout

### Phase 5: Polish & Demo Prep
- [ ] Loading state with step-by-step progress indicator during evaluation
- [ ] Error handling for upload failures and evaluation timeouts
- [ ] Mobile-responsive layout (desktop-first, basic mobile)
- [ ] Real Aetna/CMS policy PDFs uploaded and indexed
- [ ] All 5 demo moments rehearsed and confirmed working
- [ ] Frontend deployed to Vercel (public URL)
- [ ] Backend deployed to Railway

---

## What NOT To Do

- Do NOT expose `SUPABASE_SERVICE_KEY` or `ANTHROPIC_API_KEY` to the frontend
- Do NOT skip the plan step — propose before coding
- Do NOT add features outside the current phase
- Do NOT use LangChain or external RAG frameworks — the pipeline is built directly
- Do NOT add Redux — use TanStack Query for server state
- Do NOT add authentication — synthetic data only for the demo
- Do NOT chunk policy and clinical docs the same way — 512-token for policy, 256-token for clinical

---

## Key Commands

```bash
# Frontend
cd frontend && npm run dev        # Dev server on :5173
cd frontend && npm run build      # Production build

# Backend
cd backend && npm run dev         # ts-node-dev on :3001
cd backend && npm run build       # Compile TypeScript

# Synthea loader
cd backend && npx ts-node src/scripts/loadSynthea.ts ./data/synthea/
```

---

## Five Demo Moments (must work)

1. **The Search:** Type "John Smith" → patient card appears in <200ms
2. **The Upload:** Drag a clinical PDF → parsed and indexed in <10s
3. **The Determination:** Select CPT 27447 + Aetna, hit Evaluate → determination in <30s
4. **The Missing Info:** "You need HbA1c from past 90 days per Aetna CPB 0852"
5. **The Business Case:** "This saved 45 min and $14. At scale: $140K/year savings."
