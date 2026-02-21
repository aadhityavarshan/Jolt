import 'dotenv/config';
import { supabase } from './supabase';

const CPT_CODES = [
  // Orthopedic
  { code: '27447', description: 'Total knee replacement (arthroplasty)', category: 'Orthopedic' },
  { code: '27130', description: 'Total hip replacement (arthroplasty)', category: 'Orthopedic' },
  { code: '29881', description: 'Knee arthroscopy with meniscectomy', category: 'Orthopedic' },
  { code: '27446', description: 'Revision knee replacement', category: 'Orthopedic' },
  { code: '22551', description: 'Cervical spine fusion, anterior', category: 'Orthopedic' },
  { code: '22612', description: 'Lumbar spine fusion, posterior', category: 'Orthopedic' },
  { code: '23472', description: 'Total shoulder replacement', category: 'Orthopedic' },
  { code: '27702', description: 'Total ankle replacement', category: 'Orthopedic' },

  // Cardiac
  { code: '33533', description: 'Coronary artery bypass graft (CABG), single', category: 'Cardiac' },
  { code: '33534', description: 'Coronary artery bypass graft (CABG), two grafts', category: 'Cardiac' },
  { code: '92928', description: 'Percutaneous coronary stent placement', category: 'Cardiac' },
  { code: '33361', description: 'Transcatheter aortic valve replacement (TAVR)', category: 'Cardiac' },
  { code: '33249', description: 'Implantable cardioverter-defibrillator (ICD)', category: 'Cardiac' },
  { code: '33208', description: 'Permanent pacemaker insertion', category: 'Cardiac' },

  // Imaging
  { code: '70553', description: 'MRI brain with and without contrast', category: 'Imaging' },
  { code: '73721', description: 'MRI knee without contrast', category: 'Imaging' },
  { code: '73221', description: 'MRI shoulder without contrast', category: 'Imaging' },
  { code: '72148', description: 'MRI lumbar spine without contrast', category: 'Imaging' },
  { code: '74177', description: 'CT abdomen and pelvis with contrast', category: 'Imaging' },
  { code: '71260', description: 'CT chest with contrast', category: 'Imaging' },
  { code: '78816', description: 'PET scan whole body', category: 'Imaging' },
  { code: '77067', description: 'Screening mammography, bilateral', category: 'Imaging' },

  // Oncology
  { code: '96413', description: 'Chemotherapy IV infusion, first hour', category: 'Oncology' },
  { code: '96417', description: 'Chemotherapy IV infusion, each additional hour', category: 'Oncology' },
  { code: '77385', description: 'Intensity-modulated radiation therapy (IMRT)', category: 'Oncology' },
  { code: '77386', description: 'IMRT complex', category: 'Oncology' },
  { code: '38222', description: 'Bone marrow biopsy', category: 'Oncology' },

  // Neurology / Neurosurgery
  { code: '64581', description: 'Vagus nerve stimulator implant', category: 'Neurology' },
  { code: '61510', description: 'Craniotomy for tumor excision', category: 'Neurosurgery' },
  { code: '95819', description: 'Electroencephalogram (EEG) with sleep', category: 'Neurology' },
  { code: '62323', description: 'Epidural steroid injection, lumbar', category: 'Pain Management' },

  // GI / Bariatric
  { code: '43775', description: 'Laparoscopic sleeve gastrectomy', category: 'Bariatric' },
  { code: '43644', description: 'Laparoscopic Roux-en-Y gastric bypass', category: 'Bariatric' },
  { code: '43239', description: 'Upper GI endoscopy with biopsy', category: 'Gastroenterology' },
  { code: '45380', description: 'Colonoscopy with biopsy', category: 'Gastroenterology' },

  // Urology
  { code: '55840', description: 'Radical prostatectomy', category: 'Urology' },
  { code: '52000', description: 'Cystoscopy', category: 'Urology' },

  // Pulmonary
  { code: '32663', description: 'Thoracoscopic lobectomy', category: 'Pulmonary' },
  { code: '94660', description: 'CPAP initiation and management', category: 'Pulmonary' },

  // ENT
  { code: '42820', description: 'Tonsillectomy, under age 12', category: 'ENT' },
  { code: '30520', description: 'Septoplasty', category: 'ENT' },

  // Ophthalmology
  { code: '66984', description: 'Cataract surgery with IOL insertion', category: 'Ophthalmology' },
  { code: '67028', description: 'Intravitreal injection', category: 'Ophthalmology' },

  // Physical Therapy / Rehab
  { code: '97110', description: 'Therapeutic exercises', category: 'Physical Therapy' },
  { code: '97140', description: 'Manual therapy techniques', category: 'Physical Therapy' },

  // DME / Devices
  { code: 'L8614', description: 'Cochlear implant device', category: 'DME' },
  { code: 'E0601', description: 'CPAP device', category: 'DME' },
  { code: 'L8690', description: 'Auditory osseointegrated device', category: 'DME' },

  // Genetic Testing
  { code: '81162', description: 'BRCA1/BRCA2 gene full sequence analysis', category: 'Genetic Testing' },
  { code: '81225', description: 'CYP2C19 gene analysis (pharmacogenomics)', category: 'Genetic Testing' },
];

async function seed() {
  console.log(`Seeding ${CPT_CODES.length} CPT codes...`);

  const { error } = await supabase
    .from('cpt_codes')
    .upsert(CPT_CODES, { onConflict: 'code' });

  if (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }

  console.log(`Successfully seeded ${CPT_CODES.length} CPT codes.`);
  process.exit(0);
}

seed();
