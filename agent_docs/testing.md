# Testing Strategy — Jolt

## Philosophy

This is a hackathon build. We prioritize end-to-end manual verification over unit test coverage. Every feature must be verifiable before moving on. "It compiled" is not verification.

---

## Verification Checklist Per Feature

### Phase 1: Foundation

**Supabase connection:**
```typescript
// Quick test: add a temporary route
app.get('/api/health', async (req, res) => {
  const { data, error } = await supabase.from('patients').select('count').limit(1);
  res.json({ ok: !error, error });
});
```
→ `curl http://localhost:3001/api/health` should return `{ ok: true }`

**Schema deployed:**
- Open Supabase dashboard → Table Editor → confirm all 6 tables exist
- Run `SELECT * FROM cpt_codes LIMIT 5;` in SQL editor to verify seeded data

---

### Phase 2: Upload Pipeline

**Clinical PDF upload:**
```bash
curl -X POST http://localhost:3001/api/upload/clinical \
  -F "patient_id=<uuid-from-patients-table>" \
  -F "file=@/path/to/clinical_notes.pdf"
```
→ Response: `{ success: true, chunks_created: N }`
→ Verify in Supabase: `SELECT count(*) FROM document_chunks WHERE metadata->>'type' = 'clinical';`

**Policy PDF upload:**
```bash
curl -X POST http://localhost:3001/api/upload/policy \
  -F "payer=Aetna" \
  -F "cpt_codes=27447" \
  -F "file=@/path/to/aetna_cpb.pdf"
```
→ Verify: `SELECT count(*) FROM document_chunks WHERE metadata->>'payer' = 'Aetna';`

---

### Phase 3: Patient & CPT Search

**Patient search:**
```bash
curl "http://localhost:3001/api/patients/search?q=Smith"
```
→ Should return array of patients in <200ms

**Patient detail:**
```bash
curl "http://localhost:3001/api/patients/<patient-id>"
```
→ Should return patient + coverage array + document list

**CPT search:**
```bash
curl "http://localhost:3001/api/cpt/search?q=knee"
```
→ Should return CPT codes including 27447

---

### Phase 4: RAG Evaluation

**Trigger evaluation:**
```bash
curl -X POST http://localhost:3001/api/evaluate \
  -H "Content-Type: application/json" \
  -d '{"patient_id": "<uuid>", "cpt_code": "27447", "payer": "Aetna"}'
```
→ Response: `{ determination_id: "<uuid>" }`
→ Should complete within 30 seconds

**Poll for result:**
```bash
curl "http://localhost:3001/api/evaluate/<determination-id>"
```
→ Response includes:
- `probability_score` (0.0–1.0)
- `recommendation` (LIKELY_APPROVED / LIKELY_DENIED / INSUFFICIENT_INFO)
- `criteria_results` array with `met`, `evidence_quote`, `policy_citation`
- `missing_info` array

**Citation verification:**
- Pick one criterion result
- Find the `policy_citation` reference
- Open the original policy PDF and confirm the cited section contains the requirement
- Find the `clinical_citation` reference
- Confirm the evidence quote appears in the clinical document

---

### Phase 5: Frontend

**Patient search UI:**
- Open `http://localhost:5173`
- Type at least 2 characters → dropdown appears within 200ms
- Click a patient → navigates to `/patient/:id`

**Upload UI:**
- Navigate to `/admin`
- Drag and drop a PDF → progress indicator appears → success message

**Determination UI:**
- Navigate to `/determination/:id` after triggering an evaluation
- Criteria checklist shows green checkmarks (met) and red X (unmet)
- Missing info section visible
- Citations are clickable or highlighted

---

## Evaluation Quality Check

After the first real evaluation, manually verify:

1. **Criteria extraction** — does Stage 1 produce a meaningful list of requirements from the policy? (check `raw_response` in determinations table)
2. **Evidence matching** — does Stage 2 find relevant clinical evidence for each criterion?
3. **Citation accuracy** — does the `policy_citation` point to a real section in the PDF?
4. **Missing info** — are the missing items actionable? (e.g., "HbA1c from past 90 days" not just "more labs needed")

If evaluation quality is poor, tune:
- `match_threshold` in `match_chunks` calls (try 0.3–0.6)
- `match_count` (try 5–15)
- The evaluation prompt template in `ragPipeline.ts`

---

## Performance Measurement

**Search latency:**
```bash
time curl "http://localhost:3001/api/patients/search?q=Smith"
```
→ Must be <200ms real time

**Evaluation duration:**
```bash
time curl -X POST http://localhost:3001/api/evaluate ...
```
→ Must be <30s real time

**If evaluation is slow:**
- Confirm criteria are being evaluated in parallel with `Promise.all()` — not sequentially
- Reduce `match_count` if fetching too many chunks
- Batch criteria if there are more than 10

---

## Pre-Demo Checklist

- [ ] 50+ Synthea patients loaded and searchable
- [ ] At least 2 Aetna policy PDFs uploaded (knee replacement + one other)
- [ ] A known patient has clinical documents that partially meet Aetna's criteria (for the missing info demo)
- [ ] The 5 demo moments rehearsed twice end-to-end without errors
- [ ] API keys confirmed not present in the Vercel build (check browser network tab)
- [ ] Railway backend URL set as `VITE_API_URL` in Vercel
- [ ] Public Vercel URL loads in <2 seconds
