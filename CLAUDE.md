# CLAUDE.md — Claude Code Configuration for Jolt

## Project Context

**App:** Jolt — AI-powered Prior Authorization
**Stack:** React 18 + TypeScript + Vite + Tailwind + shadcn/ui | Node.js + Express | Claude Sonnet | OpenAI text-embedding-3-small | Supabase (Postgres + pgvector)
**Stage:** MVP — Hacklytics 2026 build
**User level:** In-between (comfortable with code; benefits from explanations on architecture and trade-offs)

---

## Prime Directive

**Always read `AGENTS.md` first.** It tells you the current phase, what's been completed, and what to build next. Do not skip this.

Then read the relevant `agent_docs/` file for the area you're working in.

---

## Directives

1. **Plan before coding.** State what files you'll create or modify and your approach. Wait for approval.
2. **One feature at a time.** Build → verify → move on. Do not write the whole backend at once.
3. **Explain what you're doing.** The user is in-between — give enough context to understand the decision, but keep it concise.
4. **Verify after each feature.** Suggest a curl command, a browser action, or a Supabase query to confirm the feature works.
5. **Never expose secrets.** `SUPABASE_SERVICE_KEY`, `ANTHROPIC_API_KEY`, and `OPENAI_API_KEY` stay on the server. Frontend only uses `VITE_API_URL`.
6. **Keep git clean.** Work on feature branches (`feat/feature-name`). Merge to `main` only when the feature works end-to-end.

---

## Key Commands

```bash
# Frontend (in /frontend)
npm run dev          # Vite dev server → http://localhost:5173
npm run build        # Production build
npm run lint         # ESLint check

# Backend (in /backend)
npm run dev          # ts-node-dev with hot reload → http://localhost:3001
npm run build        # Compile TypeScript → dist/
npm start            # Run compiled output (production)

# Database
# Run SQL directly in Supabase dashboard SQL editor
# Or use Supabase CLI: supabase db push

# Synthea data loader
npx ts-node backend/src/scripts/loadSynthea.ts ./data/synthea/
```

---

## Project Structure

```
jolt/
├── frontend/          # React + Vite
├── backend/           # Node.js + Express
├── docs/              # PRD, Tech Design, Research
├── AGENTS.md          # ← Read this first
├── CLAUDE.md          # This file
└── agent_docs/        # Detailed reference docs
```

---

## Critical Rules

- Do NOT use LangChain — RAG pipeline is hand-built (see `agent_docs/tech_stack.md`)
- Do NOT add Redux — TanStack Query handles all server state
- Do NOT add auth — synthetic data only for hackathon demo
- Do NOT use the same chunk size for clinical (256 tokens) and policy (512 tokens)
- Do NOT commit API keys — use `.env` files, check `.gitignore` first

---

## When You're Stuck

1. Paste the full error message and the file where it occurred
2. Say what you expected vs. what happened
3. I'll help diagnose before suggesting a fix

See `agent_docs/testing.md` for verification steps per feature.
