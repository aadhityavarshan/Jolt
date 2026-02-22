/**
 * seedPolicies.ts
 *
 * Ensures every CPT code in the catalog has at least one policy document
 * in document_chunks (payer: Aetna). Skips CPT codes that already have
 * policy chunks. Run with:
 *
 *   cd backend && npx ts-node src/scripts/seedPolicies.ts
 */

import 'dotenv/config';
import { supabase } from '../db/supabase';
import { chunkText } from '../services/chunker';
import { embedBatch } from '../services/embedder';

// ---------------------------------------------------------------------------
// Hardcoded policy text per CPT code
// ---------------------------------------------------------------------------

const POLICIES: Record<string, { policyId: string; text: string }> = {

  // ── ORTHOPEDIC ─────────────────────────────────────────────────────────────

  '27447': {
    policyId: 'CPB-0065',
    text: `Aetna Clinical Policy Bulletin 0065: Total Knee Replacement (Arthroplasty) — CPT 27447

SECTION 1: OVERVIEW
Total knee replacement (arthroplasty) (CPT 27447) involves the surgical replacement of the knee joint surfaces with artificial implants. Prior authorization is required. This policy establishes medical necessity criteria for Aetna members.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers total knee replacement (CPT 27447) medically necessary when ALL of the following criteria are met:

1. The member is 18 years of age or older.
2. Diagnosis of severe osteoarthritis (OA), rheumatoid arthritis, or post-traumatic arthritis of the knee, confirmed by radiographic evidence (X-ray or MRI) demonstrating joint space narrowing of 50% or greater, osteophyte formation, or subchondral sclerosis.
3. Moderate to severe knee pain (rated 6 or higher on a 10-point Numeric Pain Rating Scale or equivalent) that significantly limits activities of daily living.
4. Functional impairment documented by the treating orthopedic surgeon, including difficulty walking more than one block, climbing stairs, or rising from a chair.
5. Failure of at least 6 months of conservative treatment, including ALL of the following unless contraindicated:
   a. Regular use of analgesic medications (e.g., NSAIDs, acetaminophen, or opioids if NSAIDs contraindicated)
   b. Supervised physical therapy (minimum 6 weeks of formal PT)
   c. At least one of the following: intra-articular corticosteroid injections, viscosupplementation (hyaluronic acid), or bracing
6. BMI less than 40 kg/m² (BMI 40–50 may be considered with documented weight management program participation).
7. No active infection in the affected knee or surrounding tissue.
8. Medically stable for general or regional anesthesia, as documented by preoperative clearance.

SECTION 3: NOT MEDICALLY NECESSARY
Total knee replacement is considered not medically necessary when:
- The member has not completed an adequate trial of conservative therapy (minimum 6 months).
- The procedure is requested solely for cosmetic improvement.
- The member has active, uncontrolled systemic infection.
- Mild or moderate arthritis without functional limitation.

SECTION 4: DOCUMENTATION REQUIREMENTS
The following documentation must be submitted with the prior authorization request:
- Operative report or physical exam confirming knee pathology
- Radiographic reports (X-ray or MRI) with findings
- Physical therapy records demonstrating 6+ weeks of formal PT
- Pain scale documentation (VAS or NRS)
- Surgeon's operative plan and medical necessity statement
- Anesthesia pre-op clearance

SECTION 5: BILATERAL PROCEDURES
Bilateral total knee replacement (both knees during the same operative session) requires separate documentation of medical necessity for each knee and must demonstrate that staged procedures are not clinically appropriate.

References: American Academy of Orthopaedic Surgeons (AAOS) Guidelines; CMS LCD L35094.`,
  },

  '27130': {
    policyId: 'CPB-0066',
    text: `Aetna Clinical Policy Bulletin 0066: Total Hip Replacement (Arthroplasty) — CPT 27130

SECTION 1: OVERVIEW
Total hip replacement (arthroplasty) (CPT 27130) is the surgical replacement of the hip joint with a prosthetic implant. Prior authorization is required.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers total hip replacement medically necessary when ALL of the following are met:

1. Member is 18 years of age or older.
2. Diagnosis of severe hip arthritis (osteoarthritis, rheumatoid arthritis, avascular necrosis, or hip fracture sequelae) confirmed by radiographic imaging showing significant joint space loss (50% or greater), femoral head deformity, or acetabular involvement.
3. Moderate to severe hip pain (VAS or NRS ≥ 6/10) limiting ambulation or activities of daily living.
4. Failure of at least 6 months of conservative management including analgesic medications and supervised physical therapy.
5. Functional limitation: member unable to walk more than two blocks without significant pain, or unable to perform basic ADLs independently.
6. BMI < 45 kg/m² (higher BMI requires documentation of attempts at weight reduction).
7. No active infection of the hip joint or surrounding soft tissue.
8. Preoperative medical clearance for anesthesia.

SECTION 3: DOCUMENTATION REQUIREMENTS
- Hip radiograph or MRI report with grading of arthritis severity
- Pain assessment scores (recorded at multiple visits)
- Physical therapy treatment summary
- Surgeon's detailed operative plan
- Preoperative clearance from primary care or internist`,
  },

  '29881': {
    policyId: 'CPB-0240',
    text: `Aetna Clinical Policy Bulletin 0240: Knee Arthroscopy with Meniscectomy — CPT 29881

SECTION 1: OVERVIEW
Knee arthroscopy with partial meniscectomy (CPT 29881) involves arthroscopic removal of torn meniscal tissue. Prior authorization is required for non-urgent cases.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers knee arthroscopy with meniscectomy medically necessary when ALL of the following criteria are met:

1. Documented diagnosis of a meniscal tear confirmed by MRI or clinical examination (positive McMurray's test, joint line tenderness, or mechanical symptoms such as locking or catching).
2. Symptoms including knee pain, swelling, and mechanical symptoms (locking, giving way) present for at least 4–6 weeks.
3. Failure of at least 4–6 weeks of conservative treatment including: physical therapy (minimum 4 weeks), NSAIDs or analgesics, and activity modification.
4. MRI report confirming a full-thickness or partial meniscal tear amenable to surgical intervention.
5. No contraindications to anesthesia.

SECTION 3: NOT MEDICALLY NECESSARY
- Arthroscopic meniscectomy for isolated degenerative meniscal tears in the setting of moderate-to-severe osteoarthritis without mechanical symptoms.
- Procedure planned solely for cosmetic or preventive purposes.

SECTION 4: DOCUMENTATION REQUIREMENTS
- MRI report confirming meniscal tear
- Physical therapy records (4+ weeks)
- Orthopedic surgeon exam findings with documentation of mechanical symptoms
- Pain and functional limitation documentation`,
  },

  '27446': {
    policyId: 'CPB-0067',
    text: `Aetna Clinical Policy Bulletin 0067: Revision Knee Replacement — CPT 27446

SECTION 1: OVERVIEW
Revision total knee arthroplasty (CPT 27446) involves re-operation to replace or modify a previously implanted total knee prosthesis. This is considered a high-complexity procedure requiring prior authorization.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers revision knee replacement medically necessary when ANY of the following indications are present and documented:

1. Aseptic loosening of one or more implant components confirmed by radiographic imaging (radiolucent lines, component migration, or subsidence) AND associated with knee pain and functional limitation.
2. Periprosthetic joint infection (PJI) confirmed by joint aspiration culture, elevated serum ESR/CRP, or synovial fluid analysis meeting MSIS or ICM criteria.
3. Implant mechanical failure, including fracture of a component, tibial plateau fracture, or femoral component failure.
4. Severe instability (mediolateral or anteroposterior) not correctable by bracing.
5. Periprosthetic fracture requiring revision.
6. Significant bearing surface wear causing pain and loss of function.

SECTION 3: REQUIRED DOCUMENTATION
- Prior operative reports for initial TKA
- Current knee radiographs (minimum two views) demonstrating component failure or loosening
- For infection: laboratory results (WBC, ESR, CRP, joint aspirate cultures)
- Orthopedic surgeon narrative documenting indication and surgical plan`,
  },

  '22551': {
    policyId: 'CPB-0481',
    text: `Aetna Clinical Policy Bulletin 0481: Anterior Cervical Discectomy and Fusion (ACDF) — CPT 22551

SECTION 1: OVERVIEW
Anterior cervical discectomy and fusion (ACDF) (CPT 22551) is a surgical procedure for cervical spine disorders. Prior authorization is required.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers cervical spine fusion via anterior approach medically necessary for ANY of the following:

1. Cervical radiculopathy or myelopathy due to herniated nucleus pulposus or spondylosis causing neurological deficits (motor weakness, sensory loss, or hyperreflexia) confirmed by MRI or CT myelography, AND failure of at least 6 weeks of conservative treatment (physical therapy, analgesics, epidural steroid injections).
2. Cervical spinal stenosis causing myelopathy with objective neurological findings AND imaging confirmation.
3. Progressive neurological deficit despite conservative management.
4. Cervical instability or deformity (spondylolisthesis ≥ 3mm or kyphosis ≥ 11°) with associated symptoms.

SECTION 3: NOT MEDICALLY NECESSARY
- Neck pain without neurological deficit or documented instability.
- Axial cervical pain alone without radiculopathy.

SECTION 4: DOCUMENTATION
- MRI or CT myelography report
- Neurological exam findings documented by neurosurgeon or orthopedic spine surgeon
- Conservative treatment records (PT notes, injection records)
- Surgeon's preoperative plan with levels to be fused`,
  },

  '22612': {
    policyId: 'CPB-0484',
    text: `Aetna Clinical Policy Bulletin 0484: Lumbar Spine Fusion, Posterior — CPT 22612

SECTION 1: OVERVIEW
Posterior lumbar interbody fusion or posterolateral fusion (CPT 22612) is a major spinal surgical procedure. Prior authorization is required.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers posterior lumbar spine fusion medically necessary when ONE OR MORE of the following indications are present:

1. Lumbar degenerative disc disease with radiculopathy (confirmed by MRI showing herniation or foraminal stenosis at the level corresponding to the patient's symptoms) AND failure of at least 3 months of active conservative care including physical therapy (minimum 6 weeks), analgesic medications, and at least one epidural steroid injection.
2. Lumbar spinal stenosis with neurogenic claudication causing significant functional limitation (unable to walk one block without leg pain), confirmed by MRI or CT, with failure of conservative care.
3. Lumbar spondylolisthesis (Grade I or higher, Meyerding classification) with associated pain and neurological symptoms, not responsive to at least 3 months conservative care.
4. Lumbar instability with > 4mm translation or > 10° angulation on flexion-extension radiographs.
5. Failed back surgery syndrome with documented instability or recurrent herniation at prior level.

SECTION 3: DOCUMENTATION
- MRI lumbar spine report (within 12 months)
- Flexion-extension radiograph report (for instability indication)
- Physical therapy notes (6+ weeks minimum)
- Injection procedure records
- Neurosurgeon or spine surgeon operative plan with levels and technique
- Functional assessment (Oswestry Disability Index or equivalent)`,
  },

  '23472': {
    policyId: 'CPB-0350',
    text: `Aetna Clinical Policy Bulletin 0350: Total Shoulder Replacement — CPT 23472

SECTION 1: OVERVIEW
Total shoulder arthroplasty (CPT 23472) involves surgical replacement of the glenohumeral joint. Prior authorization is required.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers total shoulder replacement medically necessary when ALL of the following are met:

1. Diagnosis of severe glenohumeral arthritis (osteoarthritis, rheumatoid arthritis, avascular necrosis, or post-traumatic arthritis) confirmed by shoulder radiographs showing 50% or greater joint space loss, humeral head deformity, or glenoid erosion.
2. Moderate to severe shoulder pain (NRS ≥ 6/10) that significantly limits activities of daily living.
3. Failure of at least 6 months of conservative treatment including physical therapy, analgesics, and corticosteroid injections.
4. Significant functional impairment (inability to raise arm above shoulder level or perform basic self-care tasks).
5. No active shoulder joint infection.
6. Adequate rotator cuff integrity (for anatomic total shoulder); patients with irreparable rotator cuff tears may require reverse total shoulder arthroplasty (CPT 23473).

SECTION 3: DOCUMENTATION
- Shoulder radiographs with arthritis grading
- MRI or ultrasound report if rotator cuff status relevant
- Physical therapy records
- Pain and functional assessment
- Surgeon's plan specifying anatomic vs. reverse shoulder arthroplasty`,
  },

  '27702': {
    policyId: 'CPB-0710',
    text: `Aetna Clinical Policy Bulletin 0710: Total Ankle Replacement — CPT 27702

SECTION 1: OVERVIEW
Total ankle replacement (arthroplasty) (CPT 27702) is a surgical procedure for end-stage ankle arthritis. Prior authorization is required.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers total ankle replacement medically necessary when ALL of the following are met:

1. Diagnosis of end-stage ankle arthritis (osteoarthritis, rheumatoid arthritis, or post-traumatic) confirmed by radiographic imaging showing 75% or greater loss of ankle joint space.
2. Severe ankle pain (NRS ≥ 7/10) with significant functional limitation.
3. Failure of at least 6 months of conservative treatment including immobilization/bracing, physical therapy, analgesics, and corticosteroid injections.
4. Member is 50 years of age or older (younger patients should demonstrate low physical demand expectations).
5. Adequate ankle alignment (varus/valgus deformity < 15°); greater deformity may necessitate arthrodesis.
6. No active ankle infection, severe osteoporosis, or inadequate neurovascular status.

SECTION 3: DOCUMENTATION
- Ankle radiographs (weight-bearing views) with arthritis grading
- Physical therapy and conservative treatment records
- Surgeon's preoperative evaluation including alignment assessment`,
  },

  // ── CARDIAC ────────────────────────────────────────────────────────────────

  '33533': {
    policyId: 'CPB-0119',
    text: `Aetna Clinical Policy Bulletin 0119: Coronary Artery Bypass Graft Surgery (CABG) — CPT 33533

SECTION 1: OVERVIEW
Coronary artery bypass graft surgery (CABG) (CPT 33533, 33534) restores blood flow to the myocardium. Prior authorization is required for non-emergency cases.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers CABG medically necessary when ONE OR MORE of the following indications are documented:

1. Significant left main coronary artery stenosis (≥ 50%) as confirmed by coronary angiography.
2. Three-vessel coronary artery disease (≥ 70% stenosis in three major vessels) with or without left ventricular dysfunction.
3. Two-vessel disease involving the proximal left anterior descending artery (LAD) with objective evidence of ischemia (stress test, nuclear imaging, or fractional flow reserve < 0.80).
4. Failed percutaneous coronary intervention (PCI) with hemodynamic instability.
5. Cardiogenic shock or acute MI with coronary anatomy not suitable for PCI.
6. Diabetes mellitus with multivessel CAD (SYNTAX score > 22) where CABG is preferred over PCI per Heart Team consensus.

SECTION 3: DOCUMENTATION
- Coronary angiography report with stenosis measurements
- Left ventricular ejection fraction (ECHO or catheterization)
- Cardiothoracic surgeon's operative plan
- Heart Team consensus documentation (for multivessel CAD)
- Prior PCI reports if applicable`,
  },

  '33534': {
    policyId: 'CPB-0119',
    text: `Aetna Clinical Policy Bulletin 0119: Coronary Artery Bypass Graft — Two Grafts (CPT 33534)

This CPT code applies to CABG procedures involving two bypass grafts. All criteria from CPB-0119 (CPT 33533) apply. Additionally:

1. Two-vessel coronary artery disease with ≥ 70% stenosis requiring two separate bypass conduits is documented by coronary angiography.
2. Cardiothoracic surgeon documents why two grafts are required (anatomy, complete revascularization).

See CPB-0119 for full criteria and documentation requirements.`,
  },

  '92928': {
    policyId: 'CPB-0407',
    text: `Aetna Clinical Policy Bulletin 0407: Percutaneous Coronary Stent Placement — CPT 92928

SECTION 1: OVERVIEW
Percutaneous coronary intervention with stent placement (CPT 92928) is the catheter-based treatment of coronary artery obstructions. Prior authorization required for elective cases.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers percutaneous coronary stent placement medically necessary for ANY of the following:

1. Stable ischemic heart disease with objective evidence of ischemia on non-invasive testing (stress test, nuclear stress test, stress echocardiogram) AND coronary stenosis ≥ 70% (or ≥ 50% for left main) on diagnostic catheterization AND failure of optimal medical therapy for at least 3 months.
2. Acute coronary syndrome (NSTEMI or unstable angina) with TIMI risk score ≥ 3 or high-risk features per ACC/AHA guidelines.
3. ST-elevation MI (STEMI) — primary PCI is the standard of care (no prior auth delay required for STEMI).

SECTION 3: DOCUMENTATION (for elective cases)
- Diagnostic coronary angiography report
- Non-invasive stress test results
- Documentation of optimal medical therapy trial (aspirin, statin, beta-blocker, nitrates)
- Interventional cardiologist's procedure plan`,
  },

  '33361': {
    policyId: 'CPB-0845',
    text: `Aetna Clinical Policy Bulletin 0845: Transcatheter Aortic Valve Replacement (TAVR) — CPT 33361

SECTION 1: OVERVIEW
Transcatheter aortic valve replacement (TAVR) (CPT 33361) is a minimally invasive alternative to surgical aortic valve replacement for eligible patients with severe aortic stenosis.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers TAVR medically necessary when ALL of the following are met:

1. Diagnosis of severe symptomatic aortic stenosis defined as: aortic valve area < 1.0 cm² (or indexed AVA < 0.6 cm²/m²), AND mean gradient ≥ 40 mmHg or peak jet velocity ≥ 4.0 m/s on echocardiography.
2. Presence of symptoms attributable to severe AS (NYHA Class II, III, or IV dyspnea, syncope, or angina).
3. Evaluation by a multidisciplinary Heart Team (at minimum: interventional cardiologist and cardiac surgeon) at a TAVR-capable facility, with documented recommendation for TAVR over surgical AVR (SAVR) based on anatomic suitability, surgical risk, and patient preference.
4. CT angiography of the chest, abdomen, and pelvis confirming adequate annular size and vascular access for TAVR.
5. Member is not a candidate for balloon aortic valvuloplasty alone as a definitive treatment.

SECTION 3: DOCUMENTATION
- Echocardiography report with detailed aortic valve hemodynamics
- Heart Team evaluation and consensus note
- CT angiography report
- STS risk score or other validated surgical risk calculator output
- Patient-reported symptoms and functional class (NYHA)`,
  },

  '33249': {
    policyId: 'CPB-0280',
    text: `Aetna Clinical Policy Bulletin 0280: Implantable Cardioverter-Defibrillator (ICD) — CPT 33249

SECTION 1: OVERVIEW
Implantation of a single or dual-chamber implantable cardioverter-defibrillator (ICD) (CPT 33249) is indicated for prevention of sudden cardiac death. Prior authorization is required.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers ICD implantation medically necessary for ANY of the following:

PRIMARY PREVENTION:
1. Ischemic cardiomyopathy with left ventricular ejection fraction (LVEF) ≤ 35%, NYHA Class II or III heart failure, on optimal guideline-directed medical therapy (GDMT) for at least 3 months, with life expectancy > 1 year.
2. Non-ischemic dilated cardiomyopathy with LVEF ≤ 35%, NYHA Class II or III, on GDMT ≥ 3 months, with life expectancy > 1 year.
3. Hypertrophic cardiomyopathy with one or more major risk factors for SCD (prior cardiac arrest, spontaneous sustained VT, family history of SCD, syncope, massive LV hypertrophy ≥ 30mm, or abnormal blood pressure response to exercise).

SECONDARY PREVENTION:
4. Survivor of cardiac arrest due to VF or hemodynamically unstable VT not due to a reversible cause.
5. Documented sustained VT (spontaneous) with structural heart disease.
6. Unexplained syncope with inducible sustained VT at electrophysiologic study.

SECTION 3: DOCUMENTATION
- Echocardiography report confirming LVEF
- Cardiology visit note with NYHA class and GDMT documentation
- EP study results (if applicable)
- Cardiac arrest/VT event documentation`,
  },

  '33208': {
    policyId: 'CPB-0279',
    text: `Aetna Clinical Policy Bulletin 0279: Permanent Cardiac Pacemaker Insertion — CPT 33208

SECTION 1: OVERVIEW
Permanent pacemaker implantation (CPT 33208) is indicated for symptomatic bradyarrhythmias and conduction system disease. Prior authorization is required for elective implantation.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers permanent pacemaker insertion medically necessary for ANY of the following:

1. Symptomatic sinus node dysfunction (sick sinus syndrome) with documented bradycardia (heart rate < 40 bpm) or sinus pauses > 3 seconds causing symptoms (syncope, presyncope, significant fatigue).
2. Complete (third-degree) atrioventricular block, regardless of symptoms, when due to structural AV nodal disease.
3. Symptomatic second-degree AV block (Mobitz Type II or 2:1 AV block with wide QRS).
4. Chronotropic incompetence with symptomatic exercise intolerance.
5. After AV node ablation requiring pacing support.
6. Neurocardiogenic syncope with prolonged asystole documented on tilt-table testing or implantable loop recorder, refractory to medical therapy.

SECTION 3: DOCUMENTATION
- 12-lead ECG and prolonged cardiac monitoring (Holter or event monitor) showing arrhythmia
- Correlation of symptoms to arrhythmia (symptom-rhythm correlation)
- Cardiologist or electrophysiologist consultation note
- Electrophysiologic study results (if used for diagnosis)`,
  },

  // ── IMAGING ────────────────────────────────────────────────────────────────

  '70553': {
    policyId: 'CPB-0340',
    text: `Aetna Clinical Policy Bulletin 0340: MRI Brain with and without Contrast — CPT 70553

SECTION 1: OVERVIEW
MRI of the brain with and without contrast (CPT 70553) is indicated for evaluation of intracranial pathology. Prior authorization required for non-emergency outpatient imaging.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers brain MRI with and without contrast medically necessary for ANY of the following:

1. Evaluation of known or suspected intracranial neoplasm (primary or metastatic), including post-treatment surveillance.
2. Evaluation of known or suspected pituitary tumor or sellar region mass.
3. Evaluation of new or worsening neurological deficits (focal motor or sensory deficits, ataxia, aphasia) without adequate explanation on non-contrast MRI or CT.
4. Evaluation of suspected CNS infection (meningitis, encephalitis, abscess) when contrast enhancement is clinically necessary.
5. Multiple sclerosis — initial diagnosis or monitoring of disease activity or treatment response.
6. Evaluation of intracranial vascular malformation, cavernous malformation, or suspected dural AV fistula.
7. Workup of unexplained seizures when non-contrast MRI is non-diagnostic.

SECTION 3: NOT ROUTINELY MEDICALLY NECESSARY
- Brain MRI with contrast is not medically necessary as the initial imaging study for uncomplicated headache without neurological deficits.
- Routine screening in asymptomatic individuals without risk factors.

SECTION 4: DOCUMENTATION
- Ordering physician's clinical notes documenting neurological symptoms or indications
- Prior imaging reports (CT or non-contrast MRI) if available
- Neurology or oncology consultation note if applicable`,
  },

  '73721': {
    policyId: 'CPB-0341',
    text: `Aetna Clinical Policy Bulletin 0341: MRI Knee without Contrast — CPT 73721

SECTION 1: OVERVIEW
MRI of the knee without contrast (CPT 73721) is the gold standard for evaluating internal derangement of the knee. Prior authorization required for elective outpatient imaging.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers knee MRI without contrast medically necessary for ANY of the following:

1. Suspected meniscal tear: knee pain with mechanical symptoms (locking, catching, giving way) or positive McMurray's/Thessaly test on physical examination, after at least 4 weeks of conservative management.
2. Suspected ligamentous injury (ACL, PCL, MCL, LCL): significant knee trauma with joint instability or positive stress testing by a qualified provider.
3. Suspected osteochondral defect or cartilage injury in a patient with joint line pain and effusion not explained by plain radiographs.
4. Evaluation of known or suspected intra-articular mass or Baker's cyst with atypical features.
5. Evaluation of unexplained knee pain with normal or equivocal radiographs after 6 weeks of conservative management.

SECTION 3: DOCUMENTATION
- Physical examination findings (mechanism of injury, specific tests performed)
- Plain radiograph results
- Conservative treatment record (if applicable)
- Referring physician clinical note with working diagnosis`,
  },

  '73221': {
    policyId: 'CPB-0342',
    text: `Aetna Clinical Policy Bulletin 0342: MRI Shoulder without Contrast — CPT 73221

SECTION 1: OVERVIEW
MRI of the shoulder without contrast (CPT 73221) is used to evaluate rotator cuff, labrum, and other soft tissue pathology.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers shoulder MRI without contrast medically necessary for ANY of the following:

1. Suspected rotator cuff tear: shoulder pain with weakness on external rotation or abduction, positive impingement or Neer sign, after at least 4–6 weeks of conservative management (physical therapy, NSAIDs) and non-diagnostic plain radiographs.
2. Suspected labral tear (SLAP or Bankart): shoulder instability or history of dislocation with ongoing pain and functional limitation.
3. Evaluation of suspected biceps tendon pathology (tendinopathy, rupture) not adequately evaluated on ultrasound.
4. Pre-operative planning for shoulder surgery when soft tissue anatomy must be characterized.
5. Unexplained shoulder pain with normal radiographs after 6 weeks of conservative management.

SECTION 3: DOCUMENTATION
- Physical exam with specific shoulder tests documented
- Plain shoulder radiograph results
- Conservative treatment records`,
  },

  '72148': {
    policyId: 'CPB-0343',
    text: `Aetna Clinical Policy Bulletin 0343: MRI Lumbar Spine without Contrast — CPT 72148

SECTION 1: OVERVIEW
MRI of the lumbar spine without contrast (CPT 72148) is the preferred imaging for evaluation of lumbar disc disease, spinal stenosis, and nerve root compression.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers lumbar spine MRI medically necessary for ANY of the following:

1. Radiculopathy (sciatica) with neurological deficits (motor weakness, sensory loss, or reflex change in a dermatomal distribution) after at least 4–6 weeks of conservative management.
2. Progressive neurological deficit (new or worsening weakness, bilateral radiculopathy, saddle anesthesia, or bladder/bowel dysfunction) — URGENT.
3. Suspected cauda equina syndrome — EMERGENCY.
4. Suspicion of vertebral infection (osteomyelitis, discitis, epidural abscess): fever, elevated inflammatory markers (ESR, CRP), or history of IV drug use.
5. Suspected neoplasm (primary or metastatic): unexplained back pain in patient with known malignancy or unexplained weight loss.
6. Pre-operative planning for lumbar spine surgery.
7. Post-operative evaluation for new or recurrent symptoms (at least 6 weeks post-op).

SECTION 3: NOT ROUTINELY MEDICALLY NECESSARY
- Routine imaging for uncomplicated acute low back pain (< 6 weeks) without neurological findings.

SECTION 4: DOCUMENTATION
- Clinical exam findings (neurological testing, reflex exam, straight leg raise)
- Duration and nature of symptoms
- Conservative treatment documentation`,
  },

  '74177': {
    policyId: 'CPB-0344',
    text: `Aetna Clinical Policy Bulletin 0344: CT Abdomen and Pelvis with Contrast — CPT 74177

SECTION 1: OVERVIEW
CT of the abdomen and pelvis with contrast (CPT 74177) provides comprehensive evaluation of intra-abdominal and pelvic pathology.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers CT abdomen and pelvis with contrast medically necessary for ANY of the following:

1. Evaluation and staging of known or suspected intra-abdominal malignancy (primary or metastatic).
2. Evaluation of acute abdominal pain with suspicion for significant pathology (appendicitis, diverticulitis, bowel obstruction, vascular abnormality) in a patient requiring urgent diagnosis.
3. Follow-up evaluation of known intra-abdominal lesion (liver, kidney, adrenal mass) requiring contrast-enhanced characterization.
4. Pre-operative or pre-procedure planning for abdominal or pelvic surgery.
5. Evaluation of suspected mesenteric ischemia, aortic pathology, or abdominal aortic aneurysm.
6. Evaluation of abdominal trauma (in emergency settings, no prior auth required).

SECTION 3: DOCUMENTATION
- Clinical indication and working diagnosis
- Prior imaging results if available
- Lab values if pertinent (AFP, CEA, CA-125 for oncologic indications)`,
  },

  '71260': {
    policyId: 'CPB-0345',
    text: `Aetna Clinical Policy Bulletin 0345: CT Chest with Contrast — CPT 71260

SECTION 1: OVERVIEW
CT of the chest with contrast (CPT 71260) is indicated for evaluation of thoracic pathology requiring vascular opacification.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers CT chest with contrast medically necessary for ANY of the following:

1. Evaluation and staging of known or suspected thoracic malignancy (lung cancer, lymphoma, mesothelioma).
2. Suspicion for pulmonary embolism (CTA-PE protocol) when clinical pre-test probability is intermediate to high (Wells score ≥ 4 or elevated D-dimer).
3. Evaluation of mediastinal mass or adenopathy.
4. Evaluation of known pulmonary lesion requiring vascular characterization or post-treatment assessment.
5. Evaluation of pleural effusion with complex features.

SECTION 3: DOCUMENTATION
- Clinical indication with pre-test probability documentation for PE
- Prior imaging or labs (D-dimer, troponin as applicable)
- Oncology records for staging indications`,
  },

  '78816': {
    policyId: 'CPB-0181',
    text: `Aetna Clinical Policy Bulletin 0181: PET Scan — Whole Body — CPT 78816

SECTION 1: OVERVIEW
Whole-body PET scan (CPT 78816) uses radioactive glucose tracer to detect metabolically active lesions. Prior authorization is required.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers whole-body PET scanning medically necessary for ANY of the following oncologic indications:

1. Initial staging of non-small cell lung cancer (NSCLC), Hodgkin lymphoma, non-Hodgkin lymphoma, melanoma, colorectal cancer, esophageal cancer, or cervical cancer.
2. Restaging after completion of treatment for any of the above malignancies when change in management is anticipated.
3. Detection of recurrence when conventional imaging is equivocal and serum tumor markers are elevated.
4. Evaluation of an unknown primary with suspected malignancy where biopsy target identification would change management.
5. Assessment of treatment response in lymphoma (interim PET) per Lugano criteria.

SECTION 3: NOT MEDICALLY NECESSARY
- PET scan for initial staging of prostate cancer (PSA-driven staging preferred).
- Routine surveillance imaging without clinical indication of recurrence.

SECTION 4: DOCUMENTATION
- Oncology consultation or treating oncologist's note with staging/restaging indication
- Prior imaging reports (CT, MRI)
- Pathology report confirming malignancy diagnosis`,
  },

  '77067': {
    policyId: 'CPB-0200',
    text: `Aetna Clinical Policy Bulletin 0200: Screening Mammography — CPT 77067

SECTION 1: OVERVIEW
Bilateral screening mammography (CPT 77067) is a preventive service for early detection of breast cancer.

SECTION 2: COVERAGE CRITERIA
Aetna covers bilateral screening mammography as a preventive service under the ACA without cost-sharing for:

1. Women age 40 and older: annual screening mammography is covered.
2. Women under age 40 with elevated risk (family history of BRCA1/BRCA2 mutation, personal history of breast cancer, or prior high-risk biopsy): annual screening starting at age 25–30 or 10 years before the age of the youngest affected first-degree relative, whichever is later.

SECTION 3: DOCUMENTATION
- Age verification (date of birth)
- For early screening (< 40): clinical note documenting elevated risk factors
- Radiologist order`,
  },

  // ── ONCOLOGY ───────────────────────────────────────────────────────────────

  '96413': {
    policyId: 'CPB-0388',
    text: `Aetna Clinical Policy Bulletin 0388: Chemotherapy Infusion — CPT 96413

SECTION 1: OVERVIEW
Chemotherapy administration by IV infusion, first hour (CPT 96413) requires prior authorization for outpatient chemotherapy infusion for most regimens.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers chemotherapy infusion medically necessary when ALL of the following are met:

1. Confirmed histologic or cytologic diagnosis of malignancy requiring systemic chemotherapy.
2. Oncologist documents that the requested chemotherapy regimen is consistent with NCCN Category 1 or 2A recommendations for the documented cancer type and stage, OR is supported by published peer-reviewed evidence.
3. The member has adequate performance status (ECOG 0–2 or Karnofsky ≥ 60%) as documented in the oncology visit note.
4. Relevant laboratory values (CBC, CMP, renal function) are within acceptable parameters for chemotherapy administration.
5. Informed consent is documented.

SECTION 3: DOCUMENTATION
- Pathology report confirming malignancy
- Oncologist's treatment plan citing NCCN guideline category
- Most recent performance status (ECOG or Karnofsky)
- Recent lab results (CBC, CMP)`,
  },

  '96417': {
    policyId: 'CPB-0388',
    text: `Aetna Clinical Policy Bulletin 0388: Chemotherapy Infusion, Each Additional Hour — CPT 96417

This code is used in conjunction with CPT 96413 for each additional hour of chemotherapy infusion. All criteria from CPB-0388 (CPT 96413) apply. No separate prior authorization is required when 96413 is already authorized; 96417 is authorized as part of the same chemotherapy session.`,
  },

  '77385': {
    policyId: 'CPB-0167',
    text: `Aetna Clinical Policy Bulletin 0167: Intensity-Modulated Radiation Therapy (IMRT) — CPT 77385

SECTION 1: OVERVIEW
IMRT (CPT 77385) delivers radiation using multiple beam angles and intensity modulation to target tumors while sparing surrounding normal tissue.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers IMRT medically necessary when ALL of the following are met:

1. Histologically confirmed malignancy requiring radiation therapy as part of the treatment plan.
2. The tumor is in anatomic proximity to critical structures (spinal cord, brainstem, optic structures, salivary glands, rectum, bladder, or other organs at risk) where conventional 3D conformal radiation therapy (3D-CRT) would exceed normal tissue dose tolerances.
3. IMRT is planned by a radiation oncologist using CT-based treatment planning with dose volume histogram (DVH) analysis documenting dosimetric advantage over 3D-CRT.
4. Preferred indications include: prostate cancer, head and neck cancers, CNS tumors, gynecologic cancers, breast cancer (post-mastectomy with complex target), and pediatric tumors near critical structures.

SECTION 3: DOCUMENTATION
- Radiation oncologist's treatment plan with dosimetric comparison to 3D-CRT
- Imaging and pathology confirming diagnosis and tumor localization
- DVH analysis showing critical structure sparing`,
  },

  '77386': {
    policyId: 'CPB-0167',
    text: `Aetna Clinical Policy Bulletin 0167: IMRT Complex — CPT 77386

CPT 77386 represents a complex IMRT delivery (e.g., SIB techniques, complex field arrangements). All criteria from CPB-0167 (CPT 77385) apply. Additionally, the radiation oncologist must document the specific complexity (number of segments, arcs, or simultaneous integrated boost technique) requiring the complex IMRT code.`,
  },

  '38222': {
    policyId: 'CPB-0395',
    text: `Aetna Clinical Policy Bulletin 0395: Bone Marrow Biopsy — CPT 38222

SECTION 1: OVERVIEW
Bone marrow biopsy and aspiration (CPT 38222) is used for diagnosis and staging of hematologic malignancies and other bone marrow disorders.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers bone marrow biopsy medically necessary for ANY of the following:

1. Diagnosis or staging of known or suspected hematologic malignancy (leukemia, lymphoma, multiple myeloma, myelodysplastic syndrome, myeloproliferative neoplasm).
2. Evaluation of unexplained cytopenias (anemia, thrombocytopenia, neutropenia) not explained by peripheral blood smear or other laboratory evaluation.
3. Evaluation of unexplained leukocytosis or leukoerythroblastic blood picture.
4. Staging of non-hematologic malignancies where bone marrow involvement would change management (small cell lung cancer, neuroblastoma, Ewing sarcoma).
5. Pre-transplant evaluation for stem cell transplantation.
6. Assessment of treatment response in known hematologic malignancy.

SECTION 3: DOCUMENTATION
- Hematology/oncology consultation note with indication
- CBC and peripheral blood smear results
- Pathology results from prior biopsy (if for restaging)`,
  },

  // ── NEUROLOGY / NEUROSURGERY ───────────────────────────────────────────────

  '64581': {
    policyId: 'CPB-0543',
    text: `Aetna Clinical Policy Bulletin 0543: Vagus Nerve Stimulator (VNS) Implant — CPT 64581

SECTION 1: OVERVIEW
Vagus nerve stimulator (VNS) implantation (CPT 64581) is indicated for refractory epilepsy and treatment-resistant depression.

SECTION 2: MEDICAL NECESSITY CRITERIA — EPILEPSY INDICATION
Aetna considers VNS implantation medically necessary for partial-onset seizures when ALL of the following are met:

1. Member is 4 years of age or older.
2. Diagnosis of partial-onset (focal) epilepsy confirmed by EEG and clinical evaluation.
3. Seizures are refractory to treatment, defined as failure of at least two appropriate antiepileptic drugs (AEDs) at therapeutic doses.
4. Member is not a surgical candidate for resective epilepsy surgery, OR has failed resective surgery.
5. Neurologist or epileptologist documents that VNS is an appropriate adjunctive therapy.

SECTION 3: DOCUMENTATION
- Neurology or epilepsy specialist consultation note
- EEG reports documenting focal epilepsy
- List of prior AEDs with doses, duration, and reasons for discontinuation
- Epilepsy surgery evaluation results (if applicable)`,
  },

  '61510': {
    policyId: 'CPB-0455',
    text: `Aetna Clinical Policy Bulletin 0455: Craniotomy for Tumor Excision — CPT 61510

SECTION 1: OVERVIEW
Craniotomy for excision of intracranial neoplasm (CPT 61510) is required for surgical removal of brain tumors. Prior authorization is required for non-emergency cases.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers craniotomy for tumor excision medically necessary when ANY of the following are met:

1. Histologically confirmed or radiographically suspected intracranial neoplasm (primary brain tumor or solitary/limited cerebral metastasis) where surgical resection is the planned primary treatment.
2. Intracranial mass with life-threatening mass effect (herniation, hydrocephalus) requiring urgent decompression — EMERGENCY.
3. Diagnostic tissue acquisition (stereotactic or open biopsy) when imaging characteristics are insufficient to guide non-surgical treatment.
4. Recurrent brain tumor with good performance status (KPS ≥ 70) where re-resection is supported by neurosurgical evaluation.

SECTION 3: DOCUMENTATION
- MRI brain with and without contrast (within 4 weeks of planned surgery)
- Neurosurgery consultation with operative plan
- Multidisciplinary tumor board review (preferred)
- Neurological examination findings (KPS or ECOG)`,
  },

  '95819': {
    policyId: 'CPB-0180',
    text: `Aetna Clinical Policy Bulletin 0180: EEG with Sleep — CPT 95819

SECTION 1: OVERVIEW
Electroencephalogram with sleep (CPT 95819) records brain electrical activity including wake and sleep states. Prior authorization required for outpatient EEG.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers EEG with sleep medically necessary for ANY of the following:

1. Initial evaluation of suspected epilepsy or seizure disorder when a routine awake EEG (CPT 95816) was non-diagnostic or inconclusive.
2. Characterization of known epilepsy for classification of seizure type or epilepsy syndrome.
3. Evaluation of unexplained altered consciousness or episodic neurological events (blackouts, transient confusion) when a seizure disorder must be excluded.
4. Monitoring of antiepileptic drug therapy effectiveness in difficult-to-control epilepsy.
5. Pre-surgical epilepsy evaluation.

SECTION 3: DOCUMENTATION
- Neurology consultation note documenting clinical indication
- Prior awake EEG results (for sleep EEG as follow-up)
- Description of seizure semiology or episodic events`,
  },

  '62323': {
    policyId: 'CPB-0023',
    text: `Aetna Clinical Policy Bulletin 0023: Epidural Steroid Injection, Lumbar — CPT 62323

SECTION 1: OVERVIEW
Lumbar epidural steroid injection (ESI) (CPT 62323) delivers corticosteroid to the epidural space to reduce radicular inflammation. Prior authorization required.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers lumbar ESI medically necessary when ALL of the following are met:

1. Diagnosis of lumbar radiculopathy (sciatica) or lumbar spinal stenosis with neurogenic claudication, supported by clinical examination findings (positive straight leg raise, dermatomal sensory changes, or reflex asymmetry) AND imaging (MRI or CT) confirming nerve root compression or spinal canal stenosis at a level consistent with symptoms.
2. Moderate to severe radicular pain (NRS ≥ 5/10) that significantly limits function.
3. Failure of at least 4–6 weeks of conservative treatment including: analgesic medications (NSAIDs or nerve pain agents such as gabapentin/pregabalin) AND supervised physical therapy or home exercise program.

SECTION 3: REPEAT INJECTIONS
- A second injection in the same region may be authorized if the member had at least 50% improvement lasting at least 2 weeks after the first injection.
- A maximum of 3 injections per 6-month period in the same spinal region is considered medically necessary.
- Total of 6 injections per year across all spinal regions.

SECTION 4: DOCUMENTATION
- MRI or CT lumbar spine report confirming pathology
- Clinical exam findings with straight leg raise result and neurological findings
- Conservative treatment records (PT notes, medication list)
- Pain scores before and after prior injections (for repeat authorization)`,
  },

  // ── GI / BARIATRIC ─────────────────────────────────────────────────────────

  '43775': {
    policyId: 'CPB-0157',
    text: `Aetna Clinical Policy Bulletin 0157: Laparoscopic Sleeve Gastrectomy — CPT 43775

SECTION 1: OVERVIEW
Laparoscopic sleeve gastrectomy (LSG) (CPT 43775) is a restrictive bariatric procedure removing approximately 75–80% of the stomach. Prior authorization is required.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers laparoscopic sleeve gastrectomy medically necessary when ALL of the following are met:

1. BMI ≥ 40 kg/m², OR BMI ≥ 35 kg/m² with at least one obesity-related comorbidity (type 2 diabetes, hypertension, obstructive sleep apnea, hyperlipidemia, GERD, osteoarthritis, or non-alcoholic fatty liver disease).
2. Documented failure of at least 6 months of structured, medically supervised weight loss program within the past 2 years, including dietary counseling, behavioral modification, and exercise.
3. Member is 18 years of age or older (pediatric cases require multidisciplinary evaluation at a bariatric center of excellence).
4. Psychological evaluation by a licensed mental health professional within 12 months of the requested surgery, clearing the member for bariatric surgery.
5. No active untreated eating disorder, substance use disorder, or uncontrolled psychiatric condition that would preclude safe surgery.
6. Medical clearance from primary care physician and bariatric surgeon, confirming acceptable surgical risk.
7. Nutritional counseling completed with a registered dietitian.

SECTION 3: NOT MEDICALLY NECESSARY
- BMI < 35 kg/m² regardless of comorbidities (except in rare, individually reviewed cases).
- Revision of prior sleeve gastrectomy for weight regain alone (requires separate clinical review).

SECTION 4: DOCUMENTATION
- Documented weight history over 2+ years
- Records of supervised weight loss program (physician or dietitian notes with visit dates and weights)
- Psychological evaluation report clearing for surgery
- Nutritionist evaluation and counseling records
- Medical clearance note from PCP
- Bariatric surgeon's operative plan
- Documentation of obesity-related comorbidities (labs: HbA1c, lipid panel, sleep study results)`,
  },

  '43644': {
    policyId: 'CPB-0157',
    text: `Aetna Clinical Policy Bulletin 0157: Laparoscopic Roux-en-Y Gastric Bypass — CPT 43644

SECTION 1: OVERVIEW
Laparoscopic Roux-en-Y gastric bypass (LRYGB) (CPT 43644) is a combined restrictive and malabsorptive bariatric procedure. All criteria from CPB-0157 for bariatric surgery apply.

ADDITIONAL CONSIDERATIONS FOR BYPASS vs. SLEEVE:
1. LRYGB may be preferred over sleeve gastrectomy when the member has severe GERD, type 2 diabetes requiring better glycemic control, or failed prior sleeve gastrectomy.
2. Bariatric surgeon must document rationale for RYGB vs. sleeve in the operative plan.

All documentation requirements are identical to CPT 43775 (see CPB-0157).`,
  },

  '43239': {
    policyId: 'CPB-0270',
    text: `Aetna Clinical Policy Bulletin 0270: Upper GI Endoscopy with Biopsy — CPT 43239

SECTION 1: OVERVIEW
Esophagogastroduodenoscopy (EGD) with biopsy (CPT 43239) allows direct visualization and tissue sampling of the upper GI tract. Prior authorization required for elective procedures.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers EGD with biopsy medically necessary for ANY of the following:

1. Dysphagia or odynophagia not explained by less invasive evaluation.
2. Persistent upper abdominal pain or dyspepsia unresponsive to empirical PPI therapy for at least 4–8 weeks, OR with alarm symptoms (weight loss, anemia, early satiety, melena) warranting tissue diagnosis.
3. Known Barrett's esophagus — surveillance biopsy per ACG/AGA guidelines.
4. Suspected celiac disease — duodenal biopsy for diagnosis.
5. Evaluation and biopsy of known or suspected upper GI neoplasm.
6. Post-treatment surveillance for gastric or esophageal cancer.
7. Hematemesis or melena (acute upper GI bleed) — URGENT, no delay for authorization.

SECTION 3: DOCUMENTATION
- Clinical notes documenting indication and symptom duration
- Prior endoscopy reports and pathology results (if applicable)
- PPI trial documentation for dyspepsia indication
- Lab results (CBC for anemia, serologic celiac markers)`,
  },

  '45380': {
    policyId: 'CPB-0190',
    text: `Aetna Clinical Policy Bulletin 0190: Colonoscopy with Biopsy — CPT 45380

SECTION 1: OVERVIEW
Colonoscopy with biopsy (CPT 45380) provides visualization of the entire colon with tissue sampling. Prior authorization required for diagnostic colonoscopy (screening colonoscopy is a preventive benefit).

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers diagnostic colonoscopy with biopsy medically necessary for ANY of the following:

1. Positive stool-based colorectal cancer screening test (FIT, FOBT, FIT-DNA/Cologuard).
2. Evaluation of iron deficiency anemia in adults (after upper GI sources excluded or in high-risk patients).
3. Hematochezia (rectal bleeding) requiring colonic source evaluation.
4. Surveillance colonoscopy per ACG/USMSTF guidelines following prior adenoma removal:
   - 1–2 small tubular adenomas (< 10mm): repeat at 7–10 years
   - 3–4 adenomas or one with advanced features: repeat at 3–5 years
   - 5+ adenomas or large sessile serrated lesion: repeat at 1–3 years
5. Surveillance in inflammatory bowel disease (Crohn's colitis or ulcerative colitis) for dysplasia.
6. Evaluation of unexplained chronic diarrhea (> 4 weeks) for biopsy-proven diagnosis.

SECTION 3: DOCUMENTATION
- Clinical indication and symptom documentation
- Prior stool test results or colonoscopy reports
- Gastroenterologist or ordering physician note`,
  },

  // ── UROLOGY ────────────────────────────────────────────────────────────────

  '55840': {
    policyId: 'CPB-0420',
    text: `Aetna Clinical Policy Bulletin 0420: Radical Prostatectomy — CPT 55840

SECTION 1: OVERVIEW
Radical retropubic prostatectomy (CPT 55840) is a surgical treatment for localized prostate cancer. Prior authorization is required.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers radical prostatectomy medically necessary when ALL of the following are met:

1. Histologically confirmed prostate adenocarcinoma on biopsy (TRUS or MRI-guided biopsy).
2. Clinical stage T1c–T3a (localized or locally advanced) disease, based on DRE, PSA, and imaging (multiparametric MRI and/or bone scan as applicable).
3. Member has a life expectancy of at least 10 years.
4. Member has been counseled regarding treatment alternatives (active surveillance, radiation therapy) and chooses surgical management.
5. Adequate performance status for major pelvic surgery (ECOG 0–1).
6. No evidence of distant metastatic disease on staging workup (bone scan, CT pelvis).

SECTION 3: DOCUMENTATION
- Prostate biopsy pathology report with Gleason score and number of positive cores
- PSA value and trend
- Clinical staging workup reports (DRE documentation, pelvic MRI or CT, bone scan if PSA > 20)
- Urology consultation note documenting treatment decision
- Surgical approach plan (open, laparoscopic, or robotic-assisted)`,
  },

  '52000': {
    policyId: 'CPB-0380',
    text: `Aetna Clinical Policy Bulletin 0380: Cystoscopy — CPT 52000

SECTION 1: OVERVIEW
Cystoscopy (CPT 52000) is direct endoscopic visualization of the urethra and bladder. Prior authorization required for elective outpatient cystoscopy.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers cystoscopy medically necessary for ANY of the following:

1. Hematuria (gross or microscopic [≥ 3 RBCs/HPF on two of three properly collected urinalysis specimens]) evaluation to rule out urothelial carcinoma, after non-invasive imaging is inconclusive.
2. Evaluation and surveillance of known bladder cancer (urothelial carcinoma) per AUA guidelines.
3. Recurrent or refractory lower urinary tract symptoms (urgency, frequency, dysuria) not explained by urinalysis or culture, requiring endoscopic evaluation.
4. Suspected urethral stricture.
5. Evaluation of suspected bladder fistula.
6. Pre-operative evaluation prior to pelvic surgery.

SECTION 3: DOCUMENTATION
- Urinalysis results demonstrating hematuria (for hematuria indication)
- Renal ultrasound or CT urogram results
- Urology consultation note with indication`,
  },

  // ── PULMONARY ──────────────────────────────────────────────────────────────

  '32663': {
    policyId: 'CPB-0445',
    text: `Aetna Clinical Policy Bulletin 0445: Thoracoscopic Lobectomy (VATS) — CPT 32663

SECTION 1: OVERVIEW
Video-assisted thoracoscopic surgery (VATS) lobectomy (CPT 32663) is minimally invasive lung resection. Prior authorization required.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers thoracoscopic lobectomy medically necessary when ANY of the following are met:

1. Non-small cell lung cancer (NSCLC): clinical stage I or II disease (T1–T2, N0–N1) confirmed by PET/CT staging, with surgical resection as the intended curative treatment, AND pulmonary function testing showing adequate respiratory reserve (predicted post-operative FEV1 ≥ 40% and DLCO ≥ 40%).
2. Carcinoid tumor or other low-grade malignancy confined to a single lobe.
3. Metastatic pulmonary lesion (solitary or limited number) with controlled primary malignancy, in a patient with adequate pulmonary reserve, where resection is potentially curative.
4. Benign pulmonary lesion (e.g., hamartoma, sequestration) requiring resection due to size, location, or uncertainty about malignant potential.

SECTION 3: DOCUMENTATION
- CT chest with contrast and PET/CT for staging (NSCLC)
- Pulmonary function tests (FEV1, FVC, DLCO)
- Pathology or cytology confirming diagnosis
- Thoracic surgery consultation with operative plan
- Cardiopulmonary exercise testing if borderline PFTs`,
  },

  '94660': {
    policyId: 'CPB-0247',
    text: `Aetna Clinical Policy Bulletin 0247: CPAP Initiation and Management — CPT 94660

SECTION 1: OVERVIEW
CPAP titration and initiation (CPT 94660) for treatment of obstructive sleep apnea (OSA). Prior authorization required.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers CPAP initiation medically necessary when ALL of the following are met:

1. Diagnosis of obstructive sleep apnea confirmed by either:
   a. In-laboratory polysomnography (PSG) showing AHI ≥ 5 events/hour with symptoms (snoring, witnessed apneas, daytime sleepiness), OR AHI ≥ 15 events/hour regardless of symptoms, OR
   b. Home sleep apnea testing (HSAT) with respiratory disturbance index (RDI) ≥ 15 events/hour.
2. Member is symptomatic (Epworth Sleepiness Scale [ESS] ≥ 10, or witnessed apneas, or non-restorative sleep affecting daily function).
3. Sleep medicine physician or pulmonologist recommends CPAP as primary treatment.

SECTION 3: CPAP ADHERENCE FOR CONTINUED COVERAGE
For ongoing CPAP coverage, member must demonstrate:
- Use of CPAP ≥ 4 hours/night on ≥ 70% of nights during any consecutive 30-day period in the first 3 months of therapy (CMS compliance criteria).

SECTION 4: DOCUMENTATION
- Polysomnography or HSAT report with AHI/RDI
- Sleep medicine consultation note
- ESS or symptom documentation
- Prescription for CPAP with pressure settings`,
  },

  // ── ENT ────────────────────────────────────────────────────────────────────

  '42820': {
    policyId: 'CPB-0016',
    text: `Aetna Clinical Policy Bulletin 0016: Tonsillectomy — CPT 42820

SECTION 1: OVERVIEW
Tonsillectomy (CPT 42820) for children under age 12. Prior authorization required.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers tonsillectomy medically necessary for children under 12 when ANY of the following are met:

1. Recurrent pharyngotonsillitis: 7 or more episodes in the past year, OR 5 or more per year for 2 consecutive years, OR 3 or more per year for 3 consecutive years, with each episode documented in medical records (fever ≥ 38.3°C, tonsillar exudate, positive GABHS culture, or anterior cervical adenopathy) — Paradise Criteria.
2. Peritonsillar abscess that has not responded to medical management.
3. Obstructive sleep-disordered breathing: tonsil hypertrophy contributing to obstructive sleep apnea (AHI ≥ 5 on PSG or HSAT, or witnessed apneas with documented tonsil size 3+ on standardized scale) causing significant symptoms (failure to thrive, behavioral problems, enuresis, daytime hypersomnolence).

SECTION 3: DOCUMENTATION
- Office visit notes documenting each episode of pharyngotonsillitis with dates, symptoms, and culture results
- Tonsil size grading
- PSG or HSAT results for sleep apnea indication
- ENT surgeon consultation note with recommended approach`,
  },

  '30520': {
    policyId: 'CPB-0140',
    text: `Aetna Clinical Policy Bulletin 0140: Septoplasty — CPT 30520

SECTION 1: OVERVIEW
Septoplasty (CPT 30520) is surgical correction of a deviated nasal septum. Prior authorization required.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers septoplasty medically necessary when ALL of the following are met:

1. Documented deviated nasal septum confirmed on physical examination (anterior rhinoscopy or nasal endoscopy) by an ENT surgeon.
2. Significant nasal airway obstruction causing chronic nasal congestion, mouth breathing, or sleep-disordered breathing that significantly impairs quality of life.
3. Failure of at least 3 months of conservative medical management including intranasal corticosteroid spray (minimum 6 weeks) and nasal saline irrigation.
4. ENT surgeon documents that the septal deviation is the primary anatomic cause of nasal obstruction.

SECTION 3: NOT MEDICALLY NECESSARY
- Septoplasty performed solely for cosmetic reasons (septal deviation without symptomatic nasal obstruction).

SECTION 4: DOCUMENTATION
- ENT surgeon examination findings with septum deviation description
- Conservative treatment records (steroid spray prescription, duration of use)
- Symptom documentation (VAS nasal obstruction score or NOSE questionnaire preferred)`,
  },

  // ── OPHTHALMOLOGY ──────────────────────────────────────────────────────────

  '66984': {
    policyId: 'CPB-0290',
    text: `Aetna Clinical Policy Bulletin 0290: Cataract Surgery with IOL Insertion — CPT 66984

SECTION 1: OVERVIEW
Extracapsular cataract removal with insertion of intraocular lens (CPT 66984) is the standard surgical treatment for visually significant cataracts. Prior authorization required.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers cataract surgery medically necessary when BOTH of the following are met:

1. Visually significant cataract confirmed by ophthalmologic examination with slit lamp, demonstrating lens opacity that reduces best-corrected visual acuity (BCVA) to 20/50 or worse in the operative eye, OR functional visual impairment at any visual acuity level when the cataract is documented to cause significant glare disability, monocular diplopia, or other visual dysfunction not correctable with glasses.
2. The visual impairment interferes with the patient's activities of daily living or occupational needs, as documented by the ophthalmologist.

SECTION 3: NOT MEDICALLY NECESSARY
- Cataract extraction for visual acuity of 20/40 or better without documented functional impairment or specific occupational/driving requirement.

SECTION 4: DOCUMENTATION
- Ophthalmologist examination note with BCVA measurements (best-corrected)
- Slit lamp findings and cataract grading
- Documentation of functional impact
- Keratometry and biometry measurements for IOL selection`,
  },

  '67028': {
    policyId: 'CPB-0490',
    text: `Aetna Clinical Policy Bulletin 0490: Intravitreal Injection — CPT 67028

SECTION 1: OVERVIEW
Intravitreal injection (CPT 67028) delivers therapeutic agents (anti-VEGF, corticosteroids) directly into the vitreous cavity.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers intravitreal injection medically necessary for ANY of the following:

1. Neovascular (wet) age-related macular degeneration (AMD): presence of choroidal neovascularization confirmed by fluorescein angiography or OCT angiography with retinal fluid or subretinal hemorrhage, with anti-VEGF therapy (ranibizumab, aflibercept, or bevacizumab) as the standard of care.
2. Diabetic macular edema (DME): center-involving DME with retinal thickness ≥ 300 microns on OCT and visual acuity ≤ 20/25, when anti-VEGF is the primary treatment.
3. Macular edema due to retinal vein occlusion (branch or central): OCT-confirmed macular edema with vision loss, anti-VEGF or dexamethasone implant indicated.
4. Proliferative diabetic retinopathy (PDR): anti-VEGF as adjunct to PRP or for vitreous hemorrhage.

SECTION 3: DOCUMENTATION
- Ophthalmologist examination note with retinal diagnosis
- OCT report with central subfield thickness measurement
- FA or OCT angiography results (for AMD)
- Visual acuity measurements
- Prior injection history (agent, frequency, response)`,
  },

  // ── PHYSICAL THERAPY ───────────────────────────────────────────────────────

  '97110': {
    policyId: 'CPB-0150',
    text: `Aetna Clinical Policy Bulletin 0150: Therapeutic Exercises — CPT 97110

SECTION 1: OVERVIEW
Therapeutic exercise (CPT 97110) involves therapeutic activities designed to develop strength, endurance, range of motion, and flexibility.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers therapeutic exercise medically necessary when ALL of the following are met:

1. The member has a musculoskeletal, neurological, or systemic condition causing functional limitation that is expected to respond to physical therapy intervention.
2. Treatment is provided by or under the direct supervision of a licensed physical therapist or treating physician.
3. The treatment plan includes specific goals with objective, measurable outcomes (range of motion, strength, functional performance metrics).
4. Progress is documented at each visit; the member is making measurable improvement toward functional goals.
5. Services are not duplicative of self-directed home exercise programs that the member can safely perform independently.

SECTION 3: VISIT LIMITS
- Aetna standard benefit: up to 60 visits per calendar year for combined PT/OT/ST (check plan-specific benefits).
- Extended visits require documentation of ongoing functional improvement and clinical necessity.

SECTION 4: DOCUMENTATION
- Physical therapist evaluation with baseline functional measurements
- Treatment plan with specific goals and anticipated duration
- Progress notes at each visit with objective outcome measures`,
  },

  '97140': {
    policyId: 'CPB-0150',
    text: `Aetna Clinical Policy Bulletin 0150: Manual Therapy Techniques — CPT 97140

SECTION 1: OVERVIEW
Manual therapy (CPT 97140) includes joint mobilization/manipulation, soft tissue mobilization, and manual traction.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers manual therapy medically necessary when ALL of the following are met:

1. The member has a musculoskeletal condition (spinal dysfunction, joint hypomobility, myofascial restriction, or peripheral joint stiffness) that is expected to respond to manual intervention.
2. Provided by a licensed physical therapist, chiropractor, or osteopathic physician with training in manual techniques.
3. Manual therapy is used as part of a comprehensive treatment plan that includes therapeutic exercise (CPT 97110) and/or other active modalities; not used as the sole intervention unless medically justified.
4. Progress toward functional goals is documented.

All visit limit criteria from CPB-0150 (CPT 97110) apply.`,
  },

  // ── DME / DEVICES ──────────────────────────────────────────────────────────

  'L8614': {
    policyId: 'CPB-0556',
    text: `Aetna Clinical Policy Bulletin 0556: Cochlear Implant Device — HCPCS L8614

SECTION 1: OVERVIEW
Cochlear implant device (L8614) and associated implantation surgery require prior authorization.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers cochlear implant device medically necessary for adults when ALL of the following are met:

1. Bilateral severe-to-profound sensorineural hearing loss (pure-tone average [PTA] ≥ 70 dB HL at 500, 1000, 2000 Hz in the ear to be implanted).
2. Limited benefit from optimally fitted hearing aids, defined as ≤ 50% sentence recognition in quiet (AzBio or HINT sentences) in the best-aided listening condition in the ear to be implanted.
3. No contraindication to surgery (cochlear malformation, cochlear nerve aplasia, or active middle ear infection).
4. Audiologist and cochlear implant team evaluation at a certified cochlear implant center.
5. Appropriate motivation and support system for post-implant rehabilitation (auditory-verbal therapy).

PEDIATRIC CRITERIA (age 12 months and older):
- Bilateral severe-to-profound SNHL with PTA ≥ 90 dB HL
- Minimal benefit from hearing aids after 3–6 months of consistent use
- Absence of contraindications

SECTION 3: DOCUMENTATION
- Audiological evaluation with PTA thresholds and speech recognition scores
- Otology/neurotology examination confirming surgical candidacy
- Cochlear implant team evaluation report
- CT or MRI of temporal bones confirming cochlear patency`,
  },

  'E0601': {
    policyId: 'CPB-0247',
    text: `Aetna Clinical Policy Bulletin 0247: CPAP Device — HCPCS E0601

SECTION 1: OVERVIEW
CPAP device (E0601) for home treatment of obstructive sleep apnea. All criteria from CPB-0247 (CPT 94660 — CPAP initiation) apply for device coverage.

SECTION 2: COVERAGE CRITERIA
Aetna covers CPAP device as DME when:

1. Qualifying sleep study confirms OSA: AHI ≥ 5 with symptoms, OR AHI ≥ 15 regardless of symptoms (PSG or HSAT).
2. Prescribing physician documents medical necessity and provides CPAP prescription with pressure settings.
3. Member demonstrates compliance with CPAP use (≥ 4 hours/night on ≥ 70% of nights in the first 90 days) for continued device coverage under Medicare/CMS rules.

SECTION 3: DOCUMENTATION
- Sleep study report (PSG or HSAT)
- Physician prescription for CPAP with pressure range
- 90-day compliance download from CPAP device (for ongoing coverage)`,
  },

  'L8690': {
    policyId: 'CPB-0557',
    text: `Aetna Clinical Policy Bulletin 0557: Auditory Osseointegrated Device (Bone-Anchored Hearing Aid) — HCPCS L8690

SECTION 1: OVERVIEW
Bone-anchored hearing aid (BAHA) (L8690) is an osseointegrated implant system for patients with conductive or mixed hearing loss not amenable to conventional hearing aids.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers BAHA device medically necessary when ANY of the following are met:

1. Conductive or mixed hearing loss where bone conduction pure-tone average (BC-PTA) ≤ 45 dB HL, AND conventional hearing aids cannot be worn due to chronic ear disease (chronic otitis media, ear canal atresia, or draining mastoid cavity).
2. Single-sided deafness (SSD) with unaidable profound SNHL in one ear (PTA ≥ 90 dB HL), where BAHA on the deaf side provides CROS hearing benefit for speech understanding in noise.

SECTION 3: DOCUMENTATION
- Audiological evaluation with air conduction and bone conduction PTA
- Otology examination confirming ear canal pathology preventing conventional aid use
- Trial of conventional hearing aids with documentation of inability to wear or benefit
- Implanting surgeon's evaluation and operative plan`,
  },

  // ── GENETIC TESTING ────────────────────────────────────────────────────────

  '81162': {
    policyId: 'CPB-0521',
    text: `Aetna Clinical Policy Bulletin 0521: BRCA1/BRCA2 Gene Analysis — CPT 81162

SECTION 1: OVERVIEW
BRCA1/BRCA2 full sequence and deletion/duplication analysis (CPT 81162) identifies germline pathogenic variants associated with hereditary breast and ovarian cancer syndrome.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers BRCA1/BRCA2 testing medically necessary when the member meets ONE OR MORE of the following criteria (consistent with NCCN, USPSTF, and ACO guidelines):

1. Personal history of breast cancer and ANY of the following:
   - Diagnosed at age 45 or younger
   - Diagnosed at age 46–50 with a first-degree relative with breast cancer
   - Two primary breast cancers (bilateral or ipsilateral)
   - Triple-negative breast cancer diagnosed at age 60 or younger
2. Personal history of epithelial ovarian, fallopian tube, or peritoneal cancer.
3. Personal history of male breast cancer.
4. Known BRCA1 or BRCA2 pathogenic variant in a blood relative (variant-specific testing preferred in this case).
5. Family history meeting ANY of the following (first- or second-degree relative):
   - Breast cancer ≤ 45 years
   - Ovarian, fallopian tube, or peritoneal cancer at any age
   - Male breast cancer
   - Two or more relatives with breast cancer, one < 50 years
   - Ashkenazi Jewish ancestry with any breast or ovarian cancer in family

SECTION 3: DOCUMENTATION
- Genetic counselor or oncologist consultation note documenting family history and indication
- Pedigree or family history form with relationship and cancer diagnoses
- Personal cancer diagnosis documentation (pathology report)`,
  },

  '81225': {
    policyId: 'CPB-0525',
    text: `Aetna Clinical Policy Bulletin 0525: CYP2C19 Gene Analysis (Pharmacogenomics) — CPT 81225

SECTION 1: OVERVIEW
CYP2C19 genotyping (CPT 81225) identifies allele variants affecting metabolism of drugs including clopidogrel, PPIs, and certain antidepressants.

SECTION 2: MEDICAL NECESSITY CRITERIA
Aetna considers CYP2C19 genotyping medically necessary for:

1. Patients who have undergone percutaneous coronary intervention (PCI) and are prescribed clopidogrel, to identify poor metabolizers (CYP2C19 *2/*2 or *2/*3) at increased risk for adverse cardiovascular outcomes, where alternative antiplatelet therapy (prasugrel or ticagrelor) could be considered.
2. Patients in whom CYP2C19 metabolizer status will directly change clinical management (prescribing or dosing decision confirmed by ordering provider).

SECTION 3: NOT MEDICALLY NECESSARY
- Routine pharmacogenomic panels without a specific clinical decision being made.
- Testing in patients already on well-tolerated clopidogrel therapy without adverse events or treatment failure.

SECTION 4: DOCUMENTATION
- Cardiology or PCI procedure note confirming clopidogrel prescription and clinical context
- Ordering physician note documenting how results will change management`,
  },
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const allCptCodes = Object.keys(POLICIES);
  console.log(`\nChecking ${allCptCodes.length} CPT codes for existing policy documents...\n`);

  // Find which CPT codes already have policy chunks in document_chunks
  const { data: existingChunks, error: fetchError } = await supabase
    .from('document_chunks')
    .select('metadata')
    .eq('metadata->>type', 'policy');

  if (fetchError) {
    console.error('Failed to fetch existing policy chunks:', fetchError.message);
    process.exit(1);
  }

  // Collect all CPT codes that already have policy coverage
  const coveredCodes = new Set<string>();
  for (const chunk of existingChunks ?? []) {
    const meta = chunk.metadata as { cpt_codes?: string[] };
    if (Array.isArray(meta?.cpt_codes)) {
      for (const code of meta.cpt_codes) {
        coveredCodes.add(code);
      }
    }
  }

  const missingCodes = allCptCodes.filter((code) => !coveredCodes.has(code));

  if (missingCodes.length === 0) {
    console.log('All CPT codes already have policy documents. Nothing to seed.');
    process.exit(0);
  }

  console.log(`Found ${coveredCodes.size} already covered CPT codes.`);
  console.log(`Seeding policies for ${missingCodes.length} missing CPT codes:\n`);
  missingCodes.forEach((c) => console.log(`  - ${c}`));
  console.log();

  let totalChunks = 0;

  for (const code of missingCodes) {
    const policy = POLICIES[code];
    process.stdout.write(`[${code}] Chunking policy text...`);

    const chunks = chunkText(policy.text, 512, 64);
    process.stdout.write(` ${chunks.length} chunks. Embedding...`);

    // Batch embed all chunks for this policy
    const embeddings = await embedBatch(chunks);

    const rows = chunks.map((content, i) => ({
      content,
      embedding: embeddings[i],
      metadata: {
        type: 'policy',
        payer: 'Aetna',
        policy_id: policy.policyId,
        cpt_codes: [code],
        section_header: extractSectionHeader(content),
      },
      source_filename: `aetna_cpb_${policy.policyId.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${code}.txt`,
      chunk_index: i,
    }));

    const { error: insertError } = await supabase.from('document_chunks').insert(rows);
    if (insertError) {
      console.error(`\n[${code}] Insert failed: ${insertError.message}`);
      process.exit(1);
    }

    totalChunks += rows.length;
    console.log(` Stored ${rows.length} chunks. ✓`);
  }

  console.log(`\nDone. Seeded ${missingCodes.length} policy documents (${totalChunks} total chunks).`);
  process.exit(0);
}

function extractSectionHeader(text: string): string {
  const firstLine = text.split('\n')[0].trim();
  if (firstLine.length < 100 && !firstLine.endsWith('.')) {
    return firstLine;
  }
  return 'General';
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
