import 'dotenv/config';
import { supabase } from '../db/supabase';
import { embedBatch } from '../services/embedder';

/**
 * Seeds a dummy patient with clinical records and a policy document
 * so we can test the full RAG evaluation pipeline.
 *
 * Usage: npx ts-node src/scripts/seedTestPatient.ts
 */

async function main() {
  console.log('=== Seeding Test Patient ===\n');

  // 1. Insert patient
  const { data: patient, error: patientErr } = await supabase
    .from('patients')
    .insert({
      first_name: 'John',
      last_name: 'Smith',
      dob: '1968-03-15',
      mrn: 'MRN-TEST-001',
    })
    .select()
    .single();

  if (patientErr) throw patientErr;
  console.log(`Patient created: ${patient.id} — John Smith (DOB: 1968-03-15)`);

  // 2. Insert coverage
  const { error: covErr } = await supabase.from('coverage').insert({
    patient_id: patient.id,
    payer: 'Aetna',
    member_id: 'AET-999888777',
    plan_name: 'Aetna PPO Select',
    is_active: true,
  });

  if (covErr) throw covErr;
  console.log('Coverage created: Aetna PPO Select');

  // 3. Insert clinical document chunks (orthopedic records for knee replacement)
  const clinicalTexts = [
    `Patient: John Smith, DOB: 03/15/1968, MRN: MRN-TEST-001
Date of Visit: 01/10/2026
Provider: Dr. Sarah Chen, Orthopedic Surgery

Chief Complaint: Bilateral knee pain, right worse than left, progressive over the past 3 years.

History of Present Illness: Mr. Smith is a 57-year-old male presenting with chronic right knee pain rated 8/10.
Pain is worse with weight bearing, climbing stairs, and prolonged standing. He reports significant functional
limitation — unable to walk more than 2 blocks without rest. Night pain disrupts sleep 4-5 nights per week.

Past Medical History: Type 2 Diabetes (HbA1c 6.8% on 12/15/2025), Hypertension, BMI 31.2.`,

    `Physical Examination — Right Knee:
Inspection: Moderate varus deformity. No erythema or effusion.
ROM: Flexion 95 degrees (normal 135), Extension -5 degrees (lacks full extension).
Stability: Ligaments intact. Negative Lachman, negative drawer.
Crepitus: Significant patellofemoral and medial compartment crepitus with ROM.
Gait: Antalgic gait favoring right side.

Imaging: Weight-bearing AP and lateral radiographs of right knee obtained.
Findings: Kellgren-Lawrence Grade IV osteoarthritis with complete loss of medial joint space,
subchondral sclerosis, large osteophyte formation, and mild subluxation.

Assessment: Severe right knee osteoarthritis, Kellgren-Lawrence Grade IV.`,

    `Treatment History — Right Knee:
1. Physical therapy: Completed 12 weeks (March-June 2025) at ProMotion PT — 3x/week.
   Minimal improvement in pain or function. Discharge summary attached.
2. NSAIDs: Tried naproxen 500mg BID x 6 months, then meloxicam 15mg daily x 4 months.
   Partial relief only, discontinued due to GI side effects.
3. Corticosteroid injections: Three intra-articular injections (April 2025, July 2025, October 2025).
   Last injection provided less than 2 weeks of relief.
4. Hyaluronic acid injection: Synvisc-One injection August 2025 — no significant benefit.
5. Bracing: Unloader brace worn daily since May 2025 — provides modest relief with ambulation.

Plan: Patient has exhausted conservative treatment options over 12+ months.
Recommend total knee arthroplasty (CPT 27447) of the right knee.
Pre-operative clearance requested from PCP and endocrinology (diabetes management).`,

    `Pre-operative Clearance — Endocrinology
Date: 01/20/2026
Provider: Dr. Michael Torres, Endocrinology

Patient: John Smith, DOB: 03/15/1968
Reason for Visit: Pre-surgical clearance for right total knee arthroplasty.

Current Medications: Metformin 1000mg BID, Lisinopril 20mg daily.

Lab Results (01/15/2026):
- HbA1c: 6.8% (well controlled, target <7% for surgical clearance)
- Fasting glucose: 118 mg/dL
- Creatinine: 0.9 mg/dL (eGFR >60)
- CBC: WNL

Assessment: Type 2 diabetes mellitus, well controlled on metformin.
HbA1c 6.8% is within acceptable range for elective surgery.
Cleared for total knee arthroplasty. Recommend holding metformin morning of surgery.`,
  ];

  console.log(`\nEmbedding ${clinicalTexts.length} clinical chunks...`);
  const clinicalEmbeddings = await embedBatch(clinicalTexts);

  const clinicalRows = clinicalTexts.map((content, i) => ({
    content,
    embedding: clinicalEmbeddings[i],
    metadata: {
      type: 'clinical',
      patient_id: patient.id,
      record_type: 'orthopedic_consult',
      date: '2026-01-10',
      source_filename: 'john_smith_ortho_records.pdf',
    },
    source_filename: 'john_smith_ortho_records.pdf',
    chunk_index: i,
  }));

  const { error: clinErr } = await supabase.from('document_chunks').insert(clinicalRows);
  if (clinErr) throw clinErr;
  console.log(`Stored ${clinicalRows.length} clinical chunks`);

  // 4. Insert policy document chunks (Aetna knee replacement policy)
  const policyTexts = [
    `Aetna Clinical Policy Bulletin: Total Knee Arthroplasty (CPB 0852)
Policy Number: CPB-0852
Effective Date: 01/01/2025
Last Review: 07/01/2025
Applies to: CPT 27447 — Total Knee Arthroplasty

I. COVERAGE CRITERIA
Aetna considers total knee arthroplasty (TKA) medically necessary when ALL of the following criteria are met:

1. Patient Age: Patient must be 50 years of age or older, OR younger patients with documented
   post-traumatic arthritis, inflammatory arthropathy, or avascular necrosis.

2. Diagnosis: Radiographic evidence of advanced osteoarthritis (Kellgren-Lawrence Grade III or IV)
   with at least TWO of the following:
   a. Joint space narrowing
   b. Osteophyte formation
   c. Subchondral sclerosis
   d. Bone-on-bone contact on weight-bearing films`,

    `3. Functional Limitation: Documented significant functional impairment including at least ONE:
   a. Inability to walk more than 4 blocks
   b. Inability to perform activities of daily living (ADLs) due to knee pain
   c. Night pain that regularly disrupts sleep
   d. Range of motion less than 90 degrees or flexion contracture greater than 15 degrees

4. Conservative Treatment Failure: Documentation of failure of at least 3 months of conservative
   treatment including at least THREE of the following:
   a. Physical therapy program (minimum 6 weeks)
   b. Oral anti-inflammatory medication trial (minimum 4 weeks)
   c. Intra-articular corticosteroid injection (at least 1 injection)
   d. Activity modification and weight management counseling
   e. Assistive device use (brace, cane, or walker)
   f. Hyaluronic acid viscosupplementation`,

    `5. Medical Optimization: For patients with comorbidities, the following must be documented:
   a. Diabetes: HbA1c must be less than 8.0% within 90 days prior to surgery
   b. BMI: If BMI > 40, documentation of weight management efforts required
   c. Tobacco use: Smoking cessation counseling documented if applicable
   d. Cardiac clearance if patient has known cardiac history

II. DOCUMENTATION REQUIREMENTS
The following must be submitted with the prior authorization request:
- Office visit notes documenting clinical examination findings
- Weight-bearing radiograph reports
- Documentation of conservative treatment attempts with dates and outcomes
- Relevant lab work (HbA1c for diabetic patients, CBC, BMP)
- Specialist clearance letters if applicable

III. EXCLUSIONS
- Unicompartmental (partial) knee replacement is reviewed under CPB 0714
- Revision knee arthroplasty is reviewed under CPB 0853
- Bilateral simultaneous TKA requires separate medical necessity review`,
  ];

  console.log(`Embedding ${policyTexts.length} policy chunks...`);
  const policyEmbeddings = await embedBatch(policyTexts);

  const policyRows = policyTexts.map((content, i) => ({
    content,
    embedding: policyEmbeddings[i],
    metadata: {
      type: 'policy',
      payer: 'Aetna',
      policy_id: 'CPB-0852',
      cpt_codes: ['27447'],
      section_header: i === 0 ? 'Coverage Criteria' : i === 1 ? 'Conservative Treatment' : 'Medical Optimization',
    },
    source_filename: 'aetna_cpb_0852_tka.pdf',
    chunk_index: i,
  }));

  const { error: polErr } = await supabase.from('document_chunks').insert(policyRows);
  if (polErr) throw polErr;
  console.log(`Stored ${policyRows.length} policy chunks`);

  // Summary
  console.log('\n=== Seed Complete ===');
  console.log(`Patient ID: ${patient.id}`);
  console.log(`Patient: John Smith, DOB 1968-03-15, Aetna PPO`);
  console.log(`Clinical chunks: ${clinicalRows.length} (ortho consult + pre-op clearance)`);
  console.log(`Policy chunks: ${policyRows.length} (Aetna CPB 0852 — TKA)`);
  console.log(`\nTest the evaluation with:`);
  console.log(`curl -X POST http://localhost:3001/api/evaluate \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"patient_id": "${patient.id}", "cpt_code": "27447", "payer": "Aetna"}'`);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
