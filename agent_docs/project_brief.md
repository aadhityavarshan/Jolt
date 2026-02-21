# Project Brief — Jolt

## Vision

Jolt eliminates the most painful step in prior authorization: manually cross-referencing clinical documentation against insurance policy criteria. Physicians spend ~12 minutes per PA. Clinical staff spend ~45 minutes. Jolt does this in under 30 seconds with citations.

**Target user:** Physician or clinical staff evaluating whether a procedure will be approved by a specific payer.

**Demo context:** Hacklytics 2026 — judges are technical. The demo must be visually impressive, fast, and explainable. Every claim in the determination must have a citation.

---

## Product Principles

1. **Transparency over black boxes.** Every determination claim cites a specific policy section and clinical document. No unverifiable claims.
2. **Speed matters.** <200ms for search. <30s for evaluation. <10s for PDF ingestion. These are demo-breakers if missed.
3. **Clinical aesthetics.** Clean, professional, no playful colors. Think healthcare SaaS — not a consumer app.
4. **Synthetic data only.** No real PHI. Synthea generates realistic patient data. Real Aetna/CMS policy PDFs are public documents.

---

## Quality Gates

Before calling any feature "done," it must pass all of these:

- [ ] The happy path works end-to-end (not just the API, but the UI flow)
- [ ] Performance target is met (search <200ms, evaluation <30s, upload <10s)
- [ ] No API keys are exposed in the frontend bundle
- [ ] Error states are handled (what does the user see when something fails?)
- [ ] The feature appears in `AGENTS.md` under a completed phase item

---

## Coding Conventions

- TypeScript strict mode everywhere
- No `any` — use proper types or `unknown` with guards
- Async/await — no raw `.then()` chains
- Zod validation on all Express route inputs
- TanStack Query for all data fetching in frontend
- shadcn/ui for all standard UI components
- Feature branches: `feat/feature-name` → merge to `main` when working

---

## Key Business Context (for demo talking points)

| Stat | Source |
|------|--------|
| 35M+ prior authorizations per year | AMA |
| $11-15 cost per PA on provider side | AMA |
| ~57 minutes per PA (physician + staff combined) | AMA 2023 |
| 88% of physicians report "high" PA burden | AMA 2023 |
| 34% report patient adverse events from PA delays | AMA 2023 |

**Demo business case:** "This evaluation cost <$0.02 in API fees and took 20 seconds. Manual cost: $14 and 57 minutes. At scale across a 10-physician practice: ~$140K/year saved."

---

## What's In vs. Out for MVP

**In (must work for demo):**
- Clinical PDF upload → parsed, chunked, embedded, searchable
- Policy PDF upload → parsed with CPT metadata, chunked, embedded, searchable
- Patient search autocomplete
- CPT code search autocomplete
- Two-stage RAG evaluation with structured determination
- Criteria checklist (met/unmet) with citations
- Missing information detection
- Synthea patient bulk loader

**Out (explicitly excluded):**
- Real EHR integration (SMART on FHIR)
- Real payer submission (X12 278)
- User authentication or multi-tenancy
- PHI redaction / SafetyKit
- Multi-payer comparison (nice-to-have, only if time permits)
