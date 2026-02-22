export interface SyntheticPatient {
  first_name: string;
  last_name: string;
  dob: string;
  mrn: string;
  payer: string;
  plan_name: string;
  member_id: string;
  primary_cpt: string;
  documents: Array<{
    record_type: string;
    date: string;
    source_filename: string;
    content: string;
  }>;
}

export const SYNTHETIC_PATIENTS: SyntheticPatient[] = [
  // ─── Patient 1: Orthopedic – Total Knee Arthroplasty ───
  {
    first_name: 'Margaret',
    last_name: 'Chen',
    dob: '1961-07-22',
    mrn: 'MRN-SYNTH-001',
    payer: 'Aetna',
    plan_name: 'Aetna PPO Premier',
    member_id: 'AET-445582901',
    primary_cpt: '27447',
    documents: [
      {
        record_type: 'consultation_note',
        date: '2026-01-08',
        source_filename: 'chen_margaret_ortho_consult.pdf',
        content: `Patient: Margaret Chen, DOB: 07/22/1961, MRN: MRN-SYNTH-001
Date of Visit: 01/08/2026
Provider: Dr. James Rivera, Orthopedic Surgery

Chief Complaint: Progressive left knee pain and stiffness over 4 years, now severely limiting mobility.

History of Present Illness: Mrs. Chen is a 64-year-old female presenting with chronic left knee osteoarthritis. She reports pain rated 7-8/10 with weight bearing and 5/10 at rest. Pain worsens with stair climbing, prolonged walking (>1 block), and rising from seated position. She uses a cane for ambulation and reports significant difficulty with ADLs including dressing, bathing, and household tasks. Night pain disrupts sleep 5-6 nights per week.

Past Medical History: Hypertension (well-controlled on amlodipine 5mg), Hyperlipidemia (atorvastatin 20mg), Osteoporosis (alendronate 70mg weekly). No diabetes. BMI 28.4.

Surgical History: Right knee arthroscopy 2018 (partial meniscectomy), Cholecystectomy 2010.

Physical Examination — Left Knee:
Inspection: Moderate valgus deformity. Mild effusion present. No erythema or warmth.
ROM: Flexion 85 degrees (normal 135), Extension -8 degrees (flexion contracture).
Stability: Medial collateral ligament laxity grade I. ACL/PCL intact.
Crepitus: Significant crepitus throughout range of motion, medial > lateral.
Gait: Antalgic gait with cane, favoring left side. Trendelenburg sign negative.
Neurovascular: Dorsalis pedis and posterior tibial pulses 2+ bilaterally. Sensation intact.

Imaging Review: Weight-bearing AP, lateral, and sunrise views of left knee obtained 12/20/2025.
Findings: Kellgren-Lawrence Grade IV osteoarthritis. Complete loss of medial and patellofemoral joint space. Large marginal osteophytes medially and laterally. Subchondral sclerosis and cyst formation in medial tibial plateau. Mild lateral subluxation of the tibia.

Assessment: Severe tricompartmental left knee osteoarthritis, KL Grade IV, with significant functional impairment.

Plan: Recommend total knee arthroplasty (CPT 27447) of the left knee. Patient has failed extensive conservative management over 18+ months. Pre-operative clearance requested from PCP. Surgical risks, benefits, and alternatives discussed at length. Patient wishes to proceed.`,
      },
      {
        record_type: 'lab_results',
        date: '2026-01-12',
        source_filename: 'chen_margaret_preop_labs.pdf',
        content: `Pre-Operative Laboratory Results
Patient: Margaret Chen, DOB: 07/22/1961, MRN: MRN-SYNTH-001
Ordering Provider: Dr. James Rivera
Date Collected: 01/12/2026

Complete Blood Count (CBC):
- WBC: 6.8 x10^3/uL (ref 4.5-11.0) — Normal
- RBC: 4.2 x10^6/uL (ref 3.8-5.1) — Normal
- Hemoglobin: 13.1 g/dL (ref 12.0-16.0) — Normal
- Hematocrit: 39.2% (ref 36-46) — Normal
- Platelet Count: 245 x10^3/uL (ref 150-400) — Normal

Basic Metabolic Panel (BMP):
- Sodium: 140 mEq/L (ref 136-145) — Normal
- Potassium: 4.1 mEq/L (ref 3.5-5.0) — Normal
- Chloride: 102 mEq/L (ref 98-106) — Normal
- CO2: 24 mEq/L (ref 23-29) — Normal
- BUN: 16 mg/dL (ref 7-20) — Normal
- Creatinine: 0.8 mg/dL (ref 0.6-1.2) — Normal
- Glucose: 94 mg/dL (ref 70-100) — Normal
- Calcium: 9.4 mg/dL (ref 8.5-10.5) — Normal

Coagulation Studies:
- PT: 12.1 seconds (ref 11.0-13.5) — Normal
- INR: 1.0 (ref 0.8-1.1) — Normal
- PTT: 28 seconds (ref 25-35) — Normal

Urinalysis: Clear, no infection. pH 6.0, specific gravity 1.015, no protein, no glucose, no blood.

Interpretation: All pre-operative labs within normal limits. Patient cleared from laboratory standpoint for elective surgery.`,
      },
      {
        record_type: 'treatment_history',
        date: '2026-01-08',
        source_filename: 'chen_margaret_treatment_history.pdf',
        content: `Conservative Treatment Summary
Patient: Margaret Chen, DOB: 07/22/1961, MRN: MRN-SYNTH-001
Compiled by: Dr. James Rivera, Orthopedic Surgery
Date: 01/08/2026

1. Physical Therapy (June 2024 – September 2024):
   - 14 weeks at Summit Physical Therapy, 3x/week
   - Focused on quadriceps strengthening, ROM exercises, aquatic therapy
   - Discharge summary: Minimal improvement in pain (7/10 to 6/10). ROM unchanged.
   - Patient unable to tolerate land-based exercises due to pain.

2. Pharmacologic Management:
   - Naproxen 500mg BID (March 2024 – August 2024): Moderate relief, discontinued due to GI bleeding concern.
   - Meloxicam 15mg daily (September 2024 – February 2025): Partial relief (pain 6/10), discontinued for elevated creatinine.
   - Acetaminophen 1000mg TID (ongoing): Minimal benefit.
   - Tramadol 50mg PRN (October 2025 – present): Provides 2-3 hours of relief.

3. Intra-articular Injections:
   - Corticosteroid #1 (May 2024): Triamcinolone 40mg. Relief lasted 6 weeks.
   - Corticosteroid #2 (September 2024): Triamcinolone 40mg. Relief lasted 3 weeks.
   - Corticosteroid #3 (January 2025): Triamcinolone 40mg. Relief lasted <1 week.
   - Hyaluronic acid (Synvisc-One, April 2025): No significant benefit at 6-week follow-up.

4. Assistive Devices:
   - Unloader brace: Prescribed June 2024. Provides modest relief with ambulation.
   - Single-point cane: Using since August 2025 for balance and pain reduction.

5. Weight Management:
   - Nutritional counseling (July 2024). BMI decreased from 30.1 to 28.4 over 12 months.
   - Patient continues diet and light upper body exercise program.

Conclusion: Patient has exhausted conservative treatment over 18+ months including PT, multiple medication trials, three corticosteroid injections, viscosupplementation, bracing, and weight management. Functional decline continues. Surgical intervention is indicated.`,
      },
    ],
  },

  // ─── Patient 2: Cardiac – CABG ───
  {
    first_name: 'Robert',
    last_name: 'Williams',
    dob: '1955-11-03',
    mrn: 'MRN-SYNTH-002',
    payer: 'UnitedHealthcare',
    plan_name: 'UHC Choice Plus PPO',
    member_id: 'UHC-771234508',
    primary_cpt: '33533',
    documents: [
      {
        record_type: 'consultation_note',
        date: '2026-01-15',
        source_filename: 'williams_robert_cardiac_consult.pdf',
        content: `Patient: Robert Williams, DOB: 11/03/1955, MRN: MRN-SYNTH-002
Date of Visit: 01/15/2026
Provider: Dr. Priya Sharma, Cardiothoracic Surgery

Chief Complaint: Referral for surgical evaluation following cardiac catheterization revealing severe multi-vessel coronary artery disease.

History of Present Illness: Mr. Williams is a 70-year-old male with a history of progressive angina over the past 8 months. Initially experienced exertional chest pressure with moderate activity, now occurring with minimal exertion (walking 50 feet, climbing 3 stairs). Episodes last 5-10 minutes, relieved by rest and sublingual nitroglycerin. He reports dyspnea on exertion (DOE) and has had two ER visits in the past 3 months for chest pain. Medical management has been optimized but symptoms persist.

Past Medical History: CAD with prior MI (2019, treated with PCI to LAD with DES), Type 2 Diabetes (HbA1c 7.2%), Hypertension, Hyperlipidemia, Former smoker (quit 2020, 30 pack-year history), CKD Stage 2 (eGFR 72).

Current Medications: Aspirin 81mg, Clopidogrel 75mg, Metoprolol succinate 100mg, Atorvastatin 80mg, Lisinopril 40mg, Metformin 1000mg BID, Isosorbide mononitrate 60mg, Nitroglycerin SL PRN.

Cardiac Catheterization (01/10/2026):
- Left main: 40% stenosis
- LAD: Prior stent patent. New 90% stenosis in mid-LAD distal to stent.
- LCx: 85% stenosis in proximal segment, 70% stenosis in OM1.
- RCA: 95% ostial stenosis with TIMI 2 flow.
- LVEF: 45% with inferior wall hypokinesis.
- SYNTAX Score: 34 (high complexity — favors CABG over PCI per guidelines).

Physical Examination:
Vitals: BP 138/82, HR 68, SpO2 96% on RA.
Heart: Regular rate and rhythm. S4 gallop present. No murmurs.
Lungs: Clear to auscultation bilaterally.
Extremities: No edema. Radial and pedal pulses 2+ bilaterally.
Saphenous veins: Adequate for conduit harvest bilaterally.

Assessment: Severe three-vessel coronary artery disease with reduced LVEF (45%), high SYNTAX score (34), and ongoing angina despite maximal medical therapy. In accordance with ACC/AHA guidelines, CABG is recommended over PCI for patients with high-complexity multi-vessel disease and diabetes.

Plan: Recommend coronary artery bypass grafting (CPT 33533 — CABG using arterial graft, single). Planning LIMA-to-LAD with SVG to RCA and OM1. Pre-operative cardiac surgery workup ordered. Case discussed at Heart Team conference 01/14/2026 — unanimous recommendation for CABG.`,
      },
      {
        record_type: 'imaging_report',
        date: '2026-01-13',
        source_filename: 'williams_robert_echo.pdf',
        content: `Transthoracic Echocardiogram Report
Patient: Robert Williams, DOB: 11/03/1955, MRN: MRN-SYNTH-002
Date: 01/13/2026
Ordering Provider: Dr. Priya Sharma
Performing Sonographer: K. Martinez, RDCS

Indication: Pre-operative evaluation for CABG. Known CAD with reduced EF.

Findings:
Left Ventricle:
- LV end-diastolic dimension: 5.6 cm (mildly dilated)
- LV ejection fraction: 45% (mildly reduced, normal >55%)
- Regional wall motion: Inferior wall hypokinesis. Inferoseptal hypokinesis. Remaining walls normal.
- LV mass index: 118 g/m2 (mild LVH)

Right Ventricle:
- RV size and function normal. TAPSE 2.1 cm.

Valves:
- Mitral valve: Mild mitral regurgitation (MR), central jet. No MS.
- Aortic valve: Trileaflet, mild sclerosis without stenosis. No AI.
- Tricuspid valve: Trace TR. Estimated RVSP 32 mmHg (normal).
- Pulmonic valve: Normal.

Atria: Left atrium mildly dilated (4.2 cm). Right atrium normal.
Pericardium: No effusion.
Aorta: Ascending aorta 3.4 cm (normal). No dissection.

Impression:
1. Mildly reduced LVEF at 45% with inferior and inferoseptal hypokinesis (consistent with prior inferior MI territory).
2. Mild mitral regurgitation — functional, no structural leaflet pathology.
3. Mild LVH.
4. No significant valvular disease requiring intervention.
5. Normal right heart function and pressures.`,
      },
      {
        record_type: 'lab_results',
        date: '2026-01-14',
        source_filename: 'williams_robert_preop_labs.pdf',
        content: `Pre-Operative Laboratory Results
Patient: Robert Williams, DOB: 11/03/1955, MRN: MRN-SYNTH-002
Date Collected: 01/14/2026

CBC: WBC 7.2, Hgb 14.0, Hct 42.1, Plt 198 — all normal.
BMP: Na 141, K 4.3, Cl 101, CO2 25, BUN 22, Cr 1.3, Glucose 132 (fasting), Ca 9.2.
eGFR: 72 mL/min (CKD Stage 2, stable).
HbA1c: 7.2% (target <8% for surgical clearance).
Lipid Panel: Total cholesterol 168, LDL 72, HDL 41, Triglycerides 188.
Coagulation: PT 12.8, INR 1.1, PTT 30.
Type and Screen: A positive. Antibody screen negative.
TSH: 2.1 (normal).
BNP: 285 pg/mL (mildly elevated, consistent with reduced EF).

Carotid Duplex (01/12/2026): Bilateral <50% stenosis. No hemodynamically significant disease. No intervention needed.

Pulmonary Function Tests (01/13/2026): FEV1 2.8L (82% predicted), FVC 3.6L (85% predicted), FEV1/FVC 78%. Mild obstructive pattern. Adequate for cardiac surgery.

Interpretation: Labs acceptable for cardiac surgery. HbA1c within range. Renal function stable. No carotid intervention needed. PFTs adequate. Recommend hold metformin 48 hours pre-op. Hold aspirin 5 days, clopidogrel 5 days pre-op per cardiac surgery protocol.`,
      },
    ],
  },

  // ─── Patient 3: Imaging – Brain MRI ───
  {
    first_name: 'Diana',
    last_name: 'Patel',
    dob: '1978-04-10',
    mrn: 'MRN-SYNTH-003',
    payer: 'BCBS',
    plan_name: 'Blue Cross Blue Shield PPO',
    member_id: 'BCBS-334567812',
    primary_cpt: '70553',
    documents: [
      {
        record_type: 'consultation_note',
        date: '2026-01-20',
        source_filename: 'patel_diana_neuro_consult.pdf',
        content: `Patient: Diana Patel, DOB: 04/10/1978, MRN: MRN-SYNTH-003
Date of Visit: 01/20/2026
Provider: Dr. Alan Foster, Neurology

Chief Complaint: Recurrent severe headaches with new neurological symptoms — visual disturbances and right-hand numbness.

History of Present Illness: Ms. Patel is a 47-year-old female presenting with a 3-month history of progressively worsening headaches, occurring 4-5 times per week, rated 8/10 in severity. Headaches are bifrontal, pulsating, associated with photophobia and phonophobia. Over the past 4 weeks, she has developed intermittent visual disturbances described as "shimmering" in the right visual field lasting 20-30 minutes. Additionally, she reports episodic numbness and tingling in the right hand occurring 2-3 times daily, each lasting 5-10 minutes.

Red flag assessment: New-onset headache pattern change in a patient over 40, progressive neurological symptoms (visual and sensory), and symptoms not consistent with typical migraine aura (aura occurring independently of headache, lasting atypical duration). These features warrant urgent neuroimaging.

Past Medical History: Migraine without aura (diagnosed age 22, previously well-controlled with sumatriptan), Anxiety disorder (sertraline 50mg), No prior surgeries.

Neurological Examination:
Mental Status: Alert, oriented x4. Speech fluent. No aphasia.
Cranial Nerves: PERRLA. Visual fields full to confrontation (no deficit at time of exam). EOM intact. No facial asymmetry.
Motor: 5/5 strength all extremities. No pronator drift.
Sensory: Intact to light touch, pinprick, vibration, proprioception throughout. No sensory deficit at time of exam.
Reflexes: 2+ and symmetric. Plantar responses flexor bilaterally.
Coordination: Finger-to-nose and heel-to-shin normal. No dysmetria.
Gait: Normal gait and tandem walk.

Assessment: New-onset progressive headaches with episodic visual disturbances and right-hand paresthesias in a 47-year-old female. Differential includes intracranial mass lesion, demyelinating disease, cerebrovascular malformation, or complex migraine variant. Given red flag features, brain MRI with and without contrast (CPT 70553) is medically necessary for urgent evaluation.

Plan: Order brain MRI with and without gadolinium contrast (CPT 70553). Stat priority requested given progressive neurological symptoms. Hold sumatriptan pending imaging results. Return in 1 week for imaging review.`,
      },
      {
        record_type: 'referral_letter',
        date: '2026-01-18',
        source_filename: 'patel_diana_pcp_referral.pdf',
        content: `Referral Letter
From: Dr. Lisa Nakamura, Internal Medicine, CareFirst Primary Care
To: Dr. Alan Foster, Neurology
Date: 01/18/2026
Patient: Diana Patel, DOB: 04/10/1978, MRN: MRN-SYNTH-003

Dear Dr. Foster,

I am referring Ms. Patel for urgent neurological evaluation. She has been my patient for 12 years with a known history of episodic migraine without aura, previously well-controlled with sumatriptan PRN (average 2-3 headaches per month).

Over the past 3 months, her headache pattern has changed significantly. She now experiences near-daily headaches that are more severe than her baseline migraines and poorly responsive to sumatriptan. More concerning, she has developed new neurological symptoms over the past month:

1. Episodic visual disturbances — described as shimmering/scintillating areas in the right visual field, occurring independently of headache episodes, lasting 20-30 minutes.
2. Right hand numbness and tingling — intermittent, occurring 2-3 times daily, lasting 5-10 minutes.
3. Occasional word-finding difficulty — patient reports feeling "foggy" and struggling to find words during meetings at work.

I saw her in office on 01/15/2026. Neurological exam was grossly normal at the time of visit. No papilledema on fundoscopic exam. However, given the change in headache pattern, new focal neurological symptoms, and her age, I am concerned about an intracranial process and believe advanced neuroimaging is warranted.

I have started her on a headache diary and asked her to discontinue sumatriptan until further evaluation.

Thank you for your prompt evaluation. Please do not hesitate to contact me with questions.

Sincerely,
Dr. Lisa Nakamura, MD
CareFirst Primary Care
Phone: (555) 234-5678`,
      },
    ],
  },

  // ─── Patient 4: Oncology – Chemotherapy ───
  {
    first_name: 'Thomas',
    last_name: 'Jackson',
    dob: '1963-09-28',
    mrn: 'MRN-SYNTH-004',
    payer: 'Cigna',
    plan_name: 'Cigna Open Access Plus',
    member_id: 'CIG-998876543',
    primary_cpt: '96413',
    documents: [
      {
        record_type: 'consultation_note',
        date: '2026-01-22',
        source_filename: 'jackson_thomas_onc_consult.pdf',
        content: `Patient: Thomas Jackson, DOB: 09/28/1963, MRN: MRN-SYNTH-004
Date of Visit: 01/22/2026
Provider: Dr. Michelle Torres, Medical Oncology

Chief Complaint: Newly diagnosed Stage IIIA non-small cell lung cancer (NSCLC), referred for systemic therapy planning.

History of Present Illness: Mr. Jackson is a 62-year-old male diagnosed with NSCLC (adenocarcinoma) in December 2025 after presenting with persistent cough, hemoptysis, and 15-pound unintentional weight loss over 3 months. CT chest (12/05/2025) revealed a 4.2 cm right upper lobe mass with ipsilateral mediastinal lymphadenopathy. PET-CT (12/12/2025) confirmed FDG-avid RUL mass (SUV 12.4) and right paratracheal and subcarinal lymph nodes (SUV 8.2 and 7.1). No distant metastases identified. Brain MRI (12/18/2025) negative for intracranial disease.

Pathology: CT-guided biopsy of RUL mass (12/10/2025). Adenocarcinoma, moderately differentiated. IHC: TTF-1 positive, Napsin-A positive, CK7 positive, CK20 negative, PD-L1 TPS 45%. Molecular testing: EGFR wild-type, ALK negative, ROS1 negative, KRAS G12C mutation detected.

Staging: T2b N2 M0 — Stage IIIA per AJCC 8th edition.

ECOG Performance Status: 1 (ambulatory, capable of all self-care).

Past Medical History: COPD (mild, FEV1 72% predicted), Hypertension, Former smoker (40 pack-years, quit 2022). No prior malignancies.

Assessment and Plan:
Stage IIIA NSCLC (adenocarcinoma), KRAS G12C mutant, PD-L1 45%.

Multidisciplinary tumor board review (01/20/2026): Consensus recommendation for concurrent chemoradiation followed by durvalumab consolidation per PACIFIC trial protocol. Surgery not recommended given N2 nodal involvement.

Recommended chemotherapy regimen: Cisplatin 50 mg/m2 days 1, 8, 29, 36 + Etoposide 50 mg/m2 days 1-5 and 29-33, concurrent with definitive radiation therapy (60 Gy in 30 fractions). Chemotherapy infusion via CPT 96413 (initial hour) + 96415 (additional hours).

Pre-treatment requirements: Port-a-cath placement, baseline audiogram (cisplatin ototoxicity monitoring), renal function monitoring, pulmonary function reassessment, dental clearance. Prior authorization required for chemotherapy regimen.`,
      },
      {
        record_type: 'lab_results',
        date: '2026-01-23',
        source_filename: 'jackson_thomas_baseline_labs.pdf',
        content: `Baseline Oncology Laboratory Results
Patient: Thomas Jackson, DOB: 09/28/1963, MRN: MRN-SYNTH-004
Date Collected: 01/23/2026

CBC with Differential:
- WBC: 8.4 x10^3/uL (ref 4.5-11.0) — Normal
- Neutrophils: 62% (absolute 5.2) — Normal
- Lymphocytes: 28% (absolute 2.4) — Normal
- Hemoglobin: 13.8 g/dL — Normal
- Platelets: 312 x10^3/uL — Normal

Comprehensive Metabolic Panel:
- BUN: 18 mg/dL — Normal
- Creatinine: 1.0 mg/dL — Normal
- eGFR: 78 mL/min — Adequate for cisplatin
- AST: 22 U/L — Normal
- ALT: 28 U/L — Normal
- Total Bilirubin: 0.8 mg/dL — Normal
- Albumin: 3.9 g/dL — Normal
- LDH: 245 U/L (ref 140-280) — Normal

Tumor Markers: CEA 8.2 ng/mL (elevated, ref <3.0). To be followed as treatment marker.

Audiogram (01/22/2026): Baseline hearing within normal limits bilaterally. No pre-existing sensorineural hearing loss. Cleared for cisplatin therapy with serial monitoring recommended.

CrCl (24-hour urine, 01/23/2026): 82 mL/min. Adequate for full-dose cisplatin (threshold >60 mL/min).

Interpretation: All baseline labs adequate for initiation of cisplatin-based chemotherapy. eGFR and CrCl support full-dose cisplatin. Liver function normal. Adequate bone marrow reserve. Serial CBC and renal function monitoring recommended during treatment.`,
      },
      {
        record_type: 'imaging_report',
        date: '2025-12-12',
        source_filename: 'jackson_thomas_petct.pdf',
        content: `PET-CT Scan Report
Patient: Thomas Jackson, DOB: 09/28/1963, MRN: MRN-SYNTH-004
Date: 12/12/2025
Ordering Provider: Dr. Michelle Torres, Oncology
Radiologist: Dr. Karen Wu, Nuclear Medicine

Clinical Indication: Staging of newly diagnosed right upper lobe lung mass, biopsy-proven adenocarcinoma.

Technique: FDG PET-CT from skull base to mid-thigh following IV administration of 12.2 mCi F-18 FDG. Blood glucose at time of injection: 108 mg/dL.

Findings:
Thorax:
- Right upper lobe: 4.2 x 3.8 cm spiculated mass with intense FDG uptake, SUVmax 12.4. Mass abuts the mediastinal pleura but does not invade chest wall.
- Right paratracheal lymph node: 2.1 cm short axis, SUVmax 8.2. Pathologically enlarged and FDG-avid.
- Subcarinal lymph node: 1.8 cm short axis, SUVmax 7.1. Pathologically enlarged and FDG-avid.
- Left hilum and mediastinum: No FDG-avid lymphadenopathy.
- Lungs: Centrilobular emphysema bilaterally. No additional pulmonary nodules.
- Pleura: No effusion. No pleural FDG uptake.

Abdomen/Pelvis: Liver, spleen, pancreas, adrenal glands, kidneys unremarkable. No FDG-avid lesions. No suspicious lymphadenopathy.

Musculoskeletal: No FDG-avid osseous lesions.

Impression:
1. Intensely FDG-avid right upper lobe mass (4.2 cm, SUV 12.4) consistent with primary lung malignancy.
2. FDG-avid right paratracheal and subcarinal lymphadenopathy — findings consistent with N2 nodal disease.
3. No evidence of distant metastatic disease (M0).
4. Clinical staging: T2b N2 M0 — Stage IIIA.`,
      },
    ],
  },

  // ─── Patient 5: Bariatric – Sleeve Gastrectomy ───
  {
    first_name: 'Sandra',
    last_name: 'Morales',
    dob: '1985-02-14',
    mrn: 'MRN-SYNTH-005',
    payer: 'Humana',
    plan_name: 'Humana Gold Plus HMO',
    member_id: 'HUM-556789012',
    primary_cpt: '43775',
    documents: [
      {
        record_type: 'consultation_note',
        date: '2026-01-25',
        source_filename: 'morales_sandra_bariatric_consult.pdf',
        content: `Patient: Sandra Morales, DOB: 02/14/1985, MRN: MRN-SYNTH-005
Date of Visit: 01/25/2026
Provider: Dr. David Park, Bariatric Surgery

Chief Complaint: Referral for bariatric surgery evaluation. Morbid obesity with multiple comorbidities, failed medical weight management.

History of Present Illness: Ms. Morales is a 40-year-old female with a BMI of 44.2 (height 5'4", weight 258 lbs) presenting for bariatric surgery consultation. She has struggled with obesity since childhood and has been above BMI 40 for the past 8 years. She reports multiple supervised weight loss attempts over the past 15 years including commercial programs (Weight Watchers x 2 attempts, Jenny Craig), medically supervised programs, and pharmacotherapy.

Obesity-related comorbidities:
1. Type 2 Diabetes Mellitus — diagnosed 2020, currently on metformin 2000mg/day + semaglutide 1mg weekly. HbA1c 8.4% (poorly controlled despite dual therapy).
2. Obstructive Sleep Apnea — diagnosed 2022, uses CPAP nightly at 12 cmH2O. AHI on CPAP: 4.2 (controlled).
3. Hypertension — on lisinopril 20mg + amlodipine 5mg. BP today 142/88.
4. GERD — on omeprazole 40mg daily.
5. Bilateral knee osteoarthritis — limited mobility, uses NSAIDs regularly.
6. Depression — managed with bupropion 300mg. Psychiatrically stable.

Weight Loss History:
- Weight Watchers (2012, 2016): Lost 20-25 lbs each attempt, regained within 12 months.
- Physician-supervised low-calorie diet (2018-2019, Dr. Nakamura): 1200 cal/day x 6 months. Lost 30 lbs, regained 35 lbs within 18 months.
- Phentermine/topiramate (2021): Lost 22 lbs over 4 months, discontinued due to palpitations, regained weight.
- Semaglutide 2.4mg (2024-2025, Wegovy): Lost 28 lbs over 6 months, weight plateaued, then regained 15 lbs despite continued use. Currently on 1mg dose for diabetes.

Physical Examination:
Vitals: BP 142/88, HR 82, BMI 44.2 (258 lbs, 64 inches).
General: Well-appearing obese female in no acute distress.
Abdomen: Obese, soft, non-tender. Large panniculus. No hernias detected. Prior surgical scars: none.
Extremities: Bilateral lower extremity edema 1+. Knee crepitus bilaterally.

Assessment: Morbid obesity (BMI 44.2) with multiple obesity-related comorbidities including poorly controlled T2DM, OSA, hypertension, and OA. Patient has documented failure of comprehensive non-surgical weight management over 15+ years.

Plan: Recommend laparoscopic sleeve gastrectomy (CPT 43775). Patient meets NIH criteria for bariatric surgery (BMI >40, or >35 with comorbidities). Requires completion of multidisciplinary pre-operative program per insurance requirements: psychology evaluation, nutrition counseling (minimum 3 months supervised), cardiac clearance, updated sleep study if >12 months old, EGD. Submit prior authorization upon program completion.`,
      },
      {
        record_type: 'psych_evaluation',
        date: '2026-02-01',
        source_filename: 'morales_sandra_psych_eval.pdf',
        content: `Psychological Evaluation for Bariatric Surgery
Patient: Sandra Morales, DOB: 02/14/1985, MRN: MRN-SYNTH-005
Date: 02/01/2026
Provider: Dr. Rachel Kim, PsyD, Clinical Psychology

Reason for Evaluation: Pre-surgical psychological clearance for laparoscopic sleeve gastrectomy.

Clinical Interview Summary:
Ms. Morales presents as a motivated, well-informed candidate for bariatric surgery. She demonstrates a clear understanding of the surgical procedure, expected outcomes, dietary modifications, and lifestyle changes required post-operatively. She has attended two bariatric surgery educational seminars and has begun working with a registered dietitian.

Psychiatric History: Major Depressive Disorder, diagnosed 2018. Currently managed with bupropion XL 300mg daily and monthly therapy with a licensed clinical social worker. No hospitalizations. No suicidal ideation, past or present. No history of self-harm. No substance use disorders — denies current or past alcohol, tobacco, or drug use. No history of eating disorders (no binge eating disorder, bulimia, or anorexia). Emotional eating patterns identified — patient reports eating in response to stress and boredom. She has been working with her therapist to develop alternative coping strategies.

Psychometric Testing:
- PHQ-9: Score 6 (mild depression, well-managed on current medications)
- GAD-7: Score 4 (minimal anxiety)
- BES (Binge Eating Scale): Score 12 (no binge eating disorder)
- AUDIT-C: Score 0 (no alcohol use)

Social Support: Strong support system. Lives with spouse and two children (ages 8 and 12). Spouse is supportive of surgery and willing to participate in dietary changes. Patient has identified her spouse as primary post-operative caretaker.

Impression: Ms. Morales is psychologically appropriate for bariatric surgery. She demonstrates realistic expectations, adequate coping skills, strong social support, and compliance with pre-operative requirements. No psychiatric contraindications to surgery identified.

Recommendation: CLEARED for bariatric surgery from psychological standpoint. Recommend continued monthly therapy post-operatively for minimum 6 months to address emotional eating patterns and adjustment to dietary/lifestyle changes.`,
      },
      {
        record_type: 'nutrition_note',
        date: '2026-02-05',
        source_filename: 'morales_sandra_nutrition.pdf',
        content: `Nutrition Counseling Progress Note — Visit 1 of 6
Patient: Sandra Morales, DOB: 02/14/1985, MRN: MRN-SYNTH-005
Date: 02/05/2026
Provider: Maria Rodriguez, RDN, CSOWM (Certified Specialist in Obesity and Weight Management)

Visit Type: Initial comprehensive nutrition assessment for pre-bariatric surgery program.

Anthropometrics: Height 5'4", Weight 256 lbs (1 lb lost since surgical consult), BMI 43.9.

Dietary Assessment:
Current diet recall reveals caloric intake approximately 2200-2600 kcal/day. High in refined carbohydrates and processed foods. Meals are irregular — often skips breakfast, large lunch, frequent evening snacking. Protein intake estimated at 50-60g/day (inadequate for post-surgical needs). Fluid intake approximately 40 oz/day (below recommended).

Dietary Habits of Concern:
1. Grazing behavior — eats small amounts throughout the evening while watching TV
2. High sugar-sweetened beverage intake (2-3 sodas/day, estimated 400 kcal)
3. Low fruit and vegetable consumption (1-2 servings/day)
4. Eating speed — reports eating meals in <10 minutes

Nutrition Plan and Goals (Month 1):
1. Eliminate sugar-sweetened beverages — transition to water, unsweetened tea, or sugar-free alternatives. Target: 64 oz water/day minimum.
2. Introduce structured meal schedule — 3 meals + 1 planned snack daily. Eliminate unplanned grazing.
3. Begin practicing mindful eating — put fork down between bites, meals should take minimum 20 minutes.
4. Increase protein intake to 70-80g/day using lean meats, Greek yogurt, eggs, and protein supplements.
5. Begin bariatric vitamin regimen: daily multivitamin, calcium citrate 1200mg, vitamin D 3000 IU, B12 1000mcg.

Education Provided: Post-sleeve gastrectomy dietary progression (clear liquids → full liquids → pureed → soft → regular over 6-8 weeks). Protein goals post-surgery (60-80g/day minimum). Lifelong vitamin supplementation requirements. Dumping syndrome prevention.

Follow-up: 2 weeks for visit 2 of 6. Minimum 3 months of supervised nutrition counseling required prior to surgery per insurance mandate.`,
      },
    ],
  },

  // ─── Patient 6: Neurology – Vagus Nerve Stimulator ───
  {
    first_name: 'Kevin',
    last_name: 'O\'Brien',
    dob: '1990-06-17',
    mrn: 'MRN-SYNTH-006',
    payer: 'Aetna',
    plan_name: 'Aetna HMO',
    member_id: 'AET-667788234',
    primary_cpt: '64581',
    documents: [
      {
        record_type: 'consultation_note',
        date: '2026-01-28',
        source_filename: 'obrien_kevin_neuro_consult.pdf',
        content: `Patient: Kevin O'Brien, DOB: 06/17/1990, MRN: MRN-SYNTH-006
Date of Visit: 01/28/2026
Provider: Dr. Sarah Goldstein, Neurology — Epilepsy Center

Chief Complaint: Refractory epilepsy — evaluation for vagus nerve stimulator (VNS) implantation.

History of Present Illness: Mr. O'Brien is a 35-year-old male with a 12-year history of focal epilepsy with secondary generalization, diagnosed at age 23. Despite trials of multiple anti-epileptic drugs (AEDs), he continues to experience 6-10 seizures per month, severely impacting his quality of life, employment, and ability to drive.

Seizure Semiology: Focal onset with impaired awareness — begins with epigastric rising sensation and deja vu (aura lasting 10-20 seconds), followed by behavioral arrest, oral automatisms (lip smacking, chewing), and left hand fumbling. Progresses to bilateral tonic-clonic seizure approximately once per month. Post-ictal confusion lasting 15-30 minutes.

Anti-Epileptic Drug History (all at therapeutic doses with documented serum levels):
1. Levetiracetam (Keppra) 3000mg/day (2014-2016): Reduced seizures from 15/month to 10/month. Discontinued due to severe irritability and depression.
2. Carbamazepine (Tegretol) 1200mg/day (2016-2018): Moderate response (8 seizures/month). Discontinued due to hyponatremia (Na 128).
3. Lamotrigine (Lamictal) 400mg/day (2018-present): Current baseline medication. Seizures 8-10/month.
4. Lacosamide (Vimpat) 400mg/day (2020-present): Added to lamotrigine. Seizures decreased to 6-8/month initially, now 6-10/month.
5. Clobazam (Onfi) 20mg/day (2023-2024): Trial for 8 months as adjunctive therapy. No meaningful seizure reduction. Discontinued due to sedation.
6. Brivaracetam (Briviact) 200mg/day (2024-2025): 4-month trial. No significant improvement. Discontinued.

Epilepsy Monitoring Unit (EMU) Admission (November 2025, 5-day stay):
- Captured 8 seizures on continuous video-EEG
- Seizure onset: Right temporal lobe (right hippocampal/mesial temporal)
- Brain MRI (3T, epilepsy protocol, 11/2025): Right mesial temporal sclerosis. No other structural lesions.
- Neuropsychological testing: Mild right temporal dysfunction. No contraindication to VNS.

Surgical Candidacy Review (Epilepsy Surgery Conference, 01/15/2026):
Patient was evaluated for resective surgery (right anterior temporal lobectomy). However, given bilateral language representation on fMRI and proximity of seizure focus to language areas, the multidisciplinary team determined that resective surgery carries unacceptable risk of language deficit. VNS therapy was recommended as a safer neuromodulatory alternative.

Assessment: Drug-resistant focal epilepsy (right temporal lobe) with 6-10 seizures/month despite adequate trials of 6 AEDs. Not a candidate for resective surgery. Meets criteria for vagus nerve stimulator implantation (CPT 64581).

Plan: Recommend VNS implantation (CPT 64581 — implantation of sacral/vagus nerve neurostimulator electrode array). Submit prior authorization with documentation of AED failures, EMU report, and surgical conference recommendation.`,
      },
      {
        record_type: 'lab_results',
        date: '2026-01-29',
        source_filename: 'obrien_kevin_aed_levels.pdf',
        content: `Anti-Epileptic Drug Serum Levels and Labs
Patient: Kevin O'Brien, DOB: 06/17/1990, MRN: MRN-SYNTH-006
Date Collected: 01/29/2026

Current AED Levels (trough, drawn AM prior to morning dose):
- Lamotrigine: 8.2 mcg/mL (therapeutic range 3-14) — Therapeutic
- Lacosamide: 12.4 mcg/mL (therapeutic range 10-20) — Therapeutic

Complete Blood Count:
- WBC: 6.2 x10^3/uL — Normal
- Hemoglobin: 15.1 g/dL — Normal
- Platelets: 210 x10^3/uL — Normal

Hepatic Panel:
- AST: 24 U/L — Normal
- ALT: 30 U/L — Normal
- Alkaline Phosphatase: 68 U/L — Normal
- Total Bilirubin: 0.7 mg/dL — Normal

Basic Metabolic Panel:
- Sodium: 139 mEq/L — Normal (no recurrence of hyponatremia after carbamazepine discontinuation)
- Potassium: 4.0 mEq/L — Normal
- Creatinine: 0.9 mg/dL — Normal

Interpretation: Both current AEDs are at therapeutic serum levels, confirming compliance and adequate drug exposure despite ongoing seizures. This supports classification as drug-resistant epilepsy per ILAE definition (failure of adequate trials of two appropriately chosen and tolerated AED schedules to achieve sustained seizure freedom). Patient has failed 6 AED trials. Labs otherwise unremarkable.`,
      },
    ],
  },

  // ─── Patient 7: Pulmonary – VATS Lobectomy ───
  {
    first_name: 'Patricia',
    last_name: 'Nguyen',
    dob: '1970-12-05',
    mrn: 'MRN-SYNTH-007',
    payer: 'UnitedHealthcare',
    plan_name: 'UHC Oxford Liberty',
    member_id: 'UHC-443322110',
    primary_cpt: '32663',
    documents: [
      {
        record_type: 'consultation_note',
        date: '2026-02-01',
        source_filename: 'nguyen_patricia_thoracic_consult.pdf',
        content: `Patient: Patricia Nguyen, DOB: 12/05/1970, MRN: MRN-SYNTH-007
Date of Visit: 02/01/2026
Provider: Dr. Marcus Bell, Thoracic Surgery

Chief Complaint: Evaluation for surgical resection of right lower lobe pulmonary nodule, biopsy-proven adenocarcinoma.

History of Present Illness: Ms. Nguyen is a 55-year-old female with an incidentally discovered right lower lobe pulmonary nodule on CT chest obtained during workup for chronic cough in October 2025. Initial CT (10/15/2025) showed a 1.8 cm solid nodule in the right lower lobe. PET-CT (11/05/2025) demonstrated FDG avidity (SUVmax 5.2). CT-guided biopsy (11/18/2025) revealed adenocarcinoma, well-differentiated. Molecular: EGFR exon 19 deletion positive. PD-L1 TPS <1%.

Staging workup:
- PET-CT (11/05/2025): FDG-avid RLL nodule. No mediastinal lymphadenopathy. No distant metastases.
- Brain MRI (11/20/2025): No intracranial metastases.
- Mediastinoscopy (12/10/2025): Stations 4R, 7 sampled — negative for malignancy.
- Clinical stage: T1b N0 M0 — Stage IA2.

Past Medical History: Asthma (mild, albuterol PRN), GERD, Never-smoker, No prior surgeries.

Pulmonary Function Tests (01/15/2026):
- FEV1: 2.6 L (96% predicted) — Normal
- FVC: 3.2 L (98% predicted) — Normal
- DLCO: 88% predicted — Normal
- Predicted post-operative FEV1 (after RLL resection): 2.1 L (78% predicted) — Adequate

Physical Examination:
Vitals: BP 118/72, HR 74, SpO2 98% on RA.
Lungs: Clear bilaterally, no wheezes or crackles.
Heart: RRR, no murmurs.
General: Well-nourished, ECOG 0.

Assessment: Stage IA2 NSCLC (adenocarcinoma, EGFR+), right lower lobe, confirmed N0 by mediastinoscopy. Excellent surgical candidate with normal pulmonary function.

Plan: Recommend VATS (video-assisted thoracoscopic surgery) right lower lobectomy with mediastinal lymph node dissection (CPT 32663). Minimally invasive approach preferred given early-stage disease and excellent lung function. Expected hospital stay 3-4 days. Adjuvant therapy to be determined based on final surgical pathology — given EGFR+ status, may benefit from adjuvant osimertinib per ADAURA trial if upstaged.`,
      },
      {
        record_type: 'imaging_report',
        date: '2025-11-05',
        source_filename: 'nguyen_patricia_petct.pdf',
        content: `PET-CT Scan Report
Patient: Patricia Nguyen, DOB: 12/05/1970, MRN: MRN-SYNTH-007
Date: 11/05/2025
Ordering Provider: Dr. Marcus Bell
Radiologist: Dr. Jennifer Hayes, Nuclear Medicine

Clinical Indication: Staging of biopsy-proven right lower lobe adenocarcinoma.

Findings:
Thorax:
- Right lower lobe: 1.8 x 1.6 cm solid nodule in the posterior basal segment with moderate FDG uptake, SUVmax 5.2. Margins slightly spiculated.
- Mediastinum: No FDG-avid lymphadenopathy. No enlarged lymph nodes by size criteria.
- Left lung: Clear. No nodules.
- Pleura: No effusion or pleural FDG uptake.

Abdomen/Pelvis: No FDG-avid lesions. Liver, adrenals, kidneys unremarkable.
Musculoskeletal: No suspicious osseous lesions. Mild degenerative changes lumbar spine.

Impression:
1. FDG-avid right lower lobe nodule (1.8 cm, SUV 5.2) consistent with known primary lung adenocarcinoma.
2. No evidence of nodal or distant metastatic disease.
3. Clinical stage: T1b N0 M0 — Stage IA2.`,
      },
    ],
  },

  // ─── Patient 8: Ophthalmology – Cataract Surgery ───
  {
    first_name: 'Harold',
    last_name: 'Foster',
    dob: '1948-03-20',
    mrn: 'MRN-SYNTH-008',
    payer: 'BCBS',
    plan_name: 'BCBS Medicare Advantage',
    member_id: 'BCBS-112233445',
    primary_cpt: '66984',
    documents: [
      {
        record_type: 'consultation_note',
        date: '2026-02-03',
        source_filename: 'foster_harold_ophth_consult.pdf',
        content: `Patient: Harold Foster, DOB: 03/20/1948, MRN: MRN-SYNTH-008
Date of Visit: 02/03/2026
Provider: Dr. Amy Lin, Ophthalmology

Chief Complaint: Progressive bilateral vision loss affecting daily activities, driving, and reading.

History of Present Illness: Mr. Foster is a 77-year-old male presenting with gradually worsening vision in both eyes over the past 2 years. He reports difficulty driving, especially at night due to glare from oncoming headlights. He has difficulty reading even with updated glasses (last refraction 08/2025). He reports increased falls risk due to poor depth perception and has fallen twice in the past 6 months. Vision loss is significantly impacting his independence and quality of life.

Ocular History: Bilateral age-related cataracts (first noted 2022). No history of glaucoma, macular degeneration, retinal detachment, or prior eye surgery. No eye trauma.

Past Medical History: Hypertension (controlled), Benign prostatic hyperplasia (tamsulosin — noted for intraoperative floppy iris syndrome risk), Mild hearing loss (bilateral hearing aids).

Comprehensive Eye Examination:

Visual Acuity (best corrected):
- OD (right eye): 20/60 (ref: 20/40 six months ago — progressive decline)
- OS (left eye): 20/80 (ref: 20/50 six months ago — progressive decline)

Refraction: Updated manifest refraction performed. No significant improvement with refraction change. Current glasses are optimally corrected.

Intraocular Pressure: OD 16 mmHg, OS 15 mmHg (normal <21).

Slit Lamp Examination:
- OD: Grade 3+ nuclear sclerotic cataract with posterior subcapsular component. Moderate cortical spoking.
- OS: Grade 4+ nuclear sclerotic cataract with dense posterior subcapsular opacity. Significant cortical involvement.
- Both eyes: Anterior chambers deep and quiet. Iris normal. No neovascularization.

Dilated Fundus Examination:
- OD: Limited view due to cataract. Optic nerve appears healthy (C/D 0.3). Macula appears flat — OCT recommended to confirm.
- OS: Very limited view due to dense cataract. Optic nerve and macula obscured. B-scan ultrasound shows no retinal detachment.

OCT Macula (OD, performed today): Normal foveal contour. No macular edema, drusen, or epiretinal membrane. Central foveal thickness 262 microns (normal).

Glare Testing: Significant reduction in visual acuity with glare simulation — OD drops to 20/100, OS drops to 20/200. Consistent with patient's complaint of disabling nighttime glare.

Assessment:
1. Visually significant bilateral cataracts (OS worse than OD) causing best-corrected visual acuity below functional threshold (20/60 OD, 20/80 OS).
2. Visual impairment is affecting ADLs, driving safety, and falls risk.
3. Conservative measures exhausted (updated refraction, anti-glare lenses, improved lighting).

Plan: Recommend cataract extraction with intraocular lens implantation, left eye first (worse eye) — CPT 66984 (extracapsular cataract removal with IOL insertion). Right eye to follow 2-4 weeks later. Discussed standard monofocal IOL vs. premium multifocal options. Patient elects standard monofocal IOL. Pre-operative biometry and IOL calculations ordered. Patient on tamsulosin — surgical team aware of IFIS risk, will use iris hooks/Malyugin ring as needed.`,
      },
    ],
  },

  // ─── Patient 9: Urology – Prostatectomy ───
  {
    first_name: 'James',
    last_name: 'Turner',
    dob: '1958-08-11',
    mrn: 'MRN-SYNTH-009',
    payer: 'Cigna',
    plan_name: 'Cigna HealthSpring PPO',
    member_id: 'CIG-778899001',
    primary_cpt: '55840',
    documents: [
      {
        record_type: 'consultation_note',
        date: '2026-02-05',
        source_filename: 'turner_james_urology_consult.pdf',
        content: `Patient: James Turner, DOB: 08/11/1958, MRN: MRN-SYNTH-009
Date of Visit: 02/05/2026
Provider: Dr. Carlos Reyes, Urologic Oncology

Chief Complaint: Newly diagnosed localized prostate cancer, referred for surgical evaluation.

History of Present Illness: Mr. Turner is a 67-year-old male with recently diagnosed prostate adenocarcinoma. Elevated PSA noted on routine screening: PSA 8.4 ng/mL (06/2025), up from 4.2 ng/mL (06/2024). Digital rectal exam (07/2025) revealed a firm nodule in the right posterior lobe. MRI prostate (08/2025) showed a 1.6 cm PI-RADS 5 lesion in the right peripheral zone, no extracapsular extension, no seminal vesicle invasion.

Transrectal ultrasound-guided biopsy (09/2025): 12-core systematic + 2 MRI-targeted cores.
- Right base: Gleason 3+4=7 (Grade Group 2), 3 of 4 cores positive, maximum core involvement 40%.
- Right mid: Gleason 3+4=7 (Grade Group 2), 2 of 2 targeted cores positive, 60% involvement.
- Right apex: Gleason 3+3=6 (Grade Group 1), 1 of 2 cores positive, 15% involvement.
- Left base, mid, apex: All 6 cores negative.
- Total: 6 of 14 cores positive. Unilateral disease, right-sided.

Staging:
- Bone scan (10/2025): No osseous metastases.
- CT abdomen/pelvis (10/2025): No lymphadenopathy. No visceral metastases.
- Clinical stage: T2a N0 M0, Gleason 3+4=7, PSA 8.4. NCCN risk group: Favorable intermediate risk.

Past Medical History: Hyperlipidemia (rosuvastatin 10mg), Mild BPH (finasteride 5mg, discontinued at cancer diagnosis), No diabetes, No cardiac history. BMI 27.8. Former smoker (10 pack-years, quit 2000).

Assessment: Localized prostate adenocarcinoma, clinical stage T2a, Gleason 3+4=7, PSA 8.4, NCCN favorable intermediate risk. Patient is a good surgical candidate with >10 year life expectancy and no significant surgical comorbidities.

Treatment Options Discussed:
1. Radical prostatectomy (robotic-assisted) — recommended given age, risk group, and patient preference for definitive treatment.
2. External beam radiation + ADT — equivalent oncologic outcomes, different side effect profile.
3. Active surveillance — not recommended for intermediate-risk disease per NCCN guidelines.

Patient Decision: After extensive counseling, Mr. Turner elects robotic-assisted radical prostatectomy (CPT 55840) with bilateral pelvic lymph node dissection.

Plan: Schedule robotic radical prostatectomy (CPT 55840). Pre-op: EKG, CBC, BMP, type and screen, urology-specific pre-op visit. Pelvic floor PT referral for pre-habilitation. Consent signed and filed.`,
      },
      {
        record_type: 'imaging_report',
        date: '2025-08-15',
        source_filename: 'turner_james_mri_prostate.pdf',
        content: `MRI Prostate (Multiparametric) Report
Patient: James Turner, DOB: 08/11/1958, MRN: MRN-SYNTH-009
Date: 08/15/2025
Ordering Provider: Dr. Carlos Reyes
Radiologist: Dr. Katherine Moore

Clinical Indication: Elevated PSA (8.4 ng/mL), abnormal DRE. Evaluate for prostate cancer.

Technique: 3T MRI with endorectal coil. T2-weighted, diffusion-weighted imaging (DWI with ADC mapping), and dynamic contrast-enhanced (DCE) sequences performed per PI-RADS v2.1 protocol.

Findings:
Prostate: Volume 42 mL (mildly enlarged). Normal zonal anatomy.

Index Lesion:
- Location: Right peripheral zone, mid-gland to base.
- Size: 1.6 x 1.4 x 1.2 cm.
- T2W: Homogeneous low signal intensity, discrete, lenticular shape.
- DWI/ADC: Markedly restricted diffusion. ADC value 680 x 10^-6 mm2/s (highly suspicious).
- DCE: Early enhancement with washout kinetics.
- PI-RADS Score: 5 (very high probability of clinically significant cancer).
- No extracapsular extension (ECE). No seminal vesicle invasion (SVI).
- Neurovascular bundle: Not involved. Capsular contact <1 cm.

No additional suspicious lesions in left peripheral zone, transition zone, or anterior fibromuscular stroma.

Lymph Nodes: No pathologically enlarged pelvic or retroperitoneal lymph nodes.
Bones: No suspicious osseous lesions in the visualized skeleton.

Impression:
1. PI-RADS 5 lesion in right peripheral zone (1.6 cm) — very high suspicion for clinically significant prostate cancer. Targeted biopsy recommended.
2. No evidence of extracapsular extension or seminal vesicle invasion — suggests organ-confined disease.
3. No lymphadenopathy or bone metastases.`,
      },
    ],
  },

  // ─── Patient 10: DME – CPAP ───
  {
    first_name: 'Angela',
    last_name: 'Brooks',
    dob: '1972-10-30',
    mrn: 'MRN-SYNTH-010',
    payer: 'Humana',
    plan_name: 'Humana PPO',
    member_id: 'HUM-334455667',
    primary_cpt: 'E0601',
    documents: [
      {
        record_type: 'consultation_note',
        date: '2026-02-07',
        source_filename: 'brooks_angela_sleep_consult.pdf',
        content: `Patient: Angela Brooks, DOB: 10/30/1972, MRN: MRN-SYNTH-010
Date of Visit: 02/07/2026
Provider: Dr. Nathan Cole, Pulmonology / Sleep Medicine

Chief Complaint: Excessive daytime sleepiness, witnessed apneas, and non-restorative sleep for 2+ years.

History of Present Illness: Ms. Brooks is a 53-year-old female referred by her PCP for evaluation of suspected obstructive sleep apnea. She reports chronic excessive daytime sleepiness (Epworth Sleepiness Scale score: 16/24 — significant). Her spouse reports loud snoring every night and witnessed apneic episodes (breathing cessation lasting 10-20 seconds, occurring "many times per hour"). Patient reports waking with gasping/choking sensation 2-3 times per night. She wakes unrefreshed despite 7-8 hours of sleep time. She has fallen asleep during meetings at work on multiple occasions and reports near-miss drowsy driving incidents.

Associated symptoms: Morning headaches (4-5 days/week), nocturia (2-3 times/night), difficulty concentrating at work, irritability, decreased libido.

Past Medical History: Obesity (BMI 36.8, weight 225 lbs, height 5'5"), Hypertension (resistant — on 3 medications: lisinopril 40mg, amlodipine 10mg, hydrochlorothiazide 25mg, BP still 145/92 today), Type 2 Diabetes (HbA1c 7.8%, metformin 2000mg/day), Hypothyroidism (levothyroxine 75mcg, TSH normal on replacement), Depression (citalopram 20mg).

Physical Examination:
Vitals: BP 145/92, HR 78, BMI 36.8, SpO2 94% on RA (mildly low).
HEENT: Mallampati Class IV. Neck circumference 16.5 inches (>16 is high-risk for OSA). Retrognathia noted. Tonsillar hypertrophy grade 2+. Nasal septum midline.
Lungs: Clear bilaterally.
Heart: RRR, no murmurs.
Extremities: Trace bilateral pedal edema.

In-Lab Polysomnography (02/10/2026 — scheduled):
Results pending. Based on clinical presentation (ESS 16, witnessed apneas, BMI >35, Mallampati IV, neck >16 inches, resistant hypertension, SpO2 94%), pre-test probability for moderate-severe OSA is very high.

Assessment: High clinical suspicion for moderate-to-severe obstructive sleep apnea with significant associated morbidity (resistant hypertension, excessive daytime somnolence, near-miss driving accidents, impaired occupational function).

Plan:
1. In-lab polysomnography with split-night protocol (diagnostic first half, CPAP titration second half if AHI >20 in first 2 hours).
2. If OSA confirmed: Prescribe continuous positive airway pressure (CPAP) device (HCPCS E0601) with heated humidifier.
3. Prior authorization will be required for CPAP device. Documentation to include: PSG report with AHI, clinical symptoms, face-to-face evaluation note.
4. Refer to DME provider for mask fitting upon PA approval.
5. Follow-up in 4-6 weeks after CPAP initiation for compliance review and data download.`,
      },
      {
        record_type: 'lab_results',
        date: '2026-02-10',
        source_filename: 'brooks_angela_sleep_study.pdf',
        content: `Polysomnography Report
Patient: Angela Brooks, DOB: 10/30/1972, MRN: MRN-SYNTH-010
Date of Study: 02/10/2026
Interpreting Physician: Dr. Nathan Cole, Pulmonology / Sleep Medicine
Technologist: R. Pham, RPSGT

Study Type: In-lab, attended, split-night polysomnography.

DIAGNOSTIC PORTION (10:45 PM – 2:15 AM, 3.5 hours):
Total recording time: 210 minutes. Total sleep time: 185 minutes.
Sleep onset latency: 4 minutes (shortened, normal <20).
Sleep efficiency: 88%.

Sleep Architecture:
- N1: 18% (elevated, normal <5%)
- N2: 62%
- N3 (slow wave): 5% (reduced, normal 15-20%)
- REM: 15% (slightly reduced)
- REM latency: 85 minutes

Respiratory Events (Diagnostic):
- Obstructive apneas: 48
- Hypopneas: 34
- Central apneas: 2
- Mixed apneas: 4
- Total AHI: 28.5 events/hour (SEVERE — normal <5, mild 5-15, moderate 15-30, severe >30)
- REM AHI: 52.3 events/hour
- Supine AHI: 38.2 events/hour
- Lowest SpO2: 78% (severe desaturation, normal >90%)
- Time SpO2 <90%: 22% of total sleep time
- Oxygen Desaturation Index (ODI): 26.4/hour

CPAP TITRATION PORTION (2:15 AM – 6:30 AM, 4.25 hours):
Split-night criteria met (AHI >20 in first 2 hours). CPAP titration initiated.
- CPAP 5 cmH2O: AHI 18, desaturations persistent
- CPAP 8 cmH2O: AHI 8, improved but residual hypopneas
- CPAP 10 cmH2O: AHI 4.2, SpO2 maintained >92%, snoring eliminated
- CPAP 12 cmH2O: AHI 2.1, SpO2 >94%, optimal. REM sleep captured and controlled at this pressure.
- Optimal titration pressure: 12 cmH2O

Impression:
1. Severe obstructive sleep apnea (AHI 28.5/hour) with significant oxygen desaturation (nadir 78%, 22% TST <90%).
2. Positional and REM-predominant component.
3. Successful CPAP titration — optimal pressure 12 cmH2O (residual AHI 2.1).
4. CPAP therapy is medically necessary. Recommend CPAP (HCPCS E0601) at 12 cmH2O with heated humidification.`,
      },
    ],
  },
];
