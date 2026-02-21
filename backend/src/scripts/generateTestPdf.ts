import { PDFDocument, StandardFonts } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

async function generatePolicyPdf() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([612, 792]);

  let y = 740;
  const write = (text: string, size = 11, bold = false) => {
    page.drawText(text, { x: 50, y, size, font: bold ? boldFont : font });
    y -= size + 6;
  };

  write('Aetna Clinical Policy Bulletin: 0852', 16, true);
  y -= 10;
  write('Subject: Total Knee Arthroplasty (TKA)', 13, true);
  write('CPT Code: 27447', 11);
  write('Effective Date: January 1, 2025', 11);
  y -= 10;

  write('I. Clinical Indications', 13, true);
  y -= 4;
  write('Aetna considers total knee arthroplasty (TKA) medically necessary when');
  write('ALL of the following criteria are met:');
  y -= 6;
  write('1. Severe knee pain that interferes with daily activities and is not');
  write('   adequately relieved by conservative treatment for at least 3 months.');
  y -= 4;
  write('2. Radiographic evidence of moderate-to-severe osteoarthritis');
  write('   (Kellgren-Lawrence Grade III or IV).');
  y -= 4;
  write('3. Failed conservative treatment including at least TWO of:');
  write('   a) Physical therapy for a minimum of 6 weeks');
  write('   b) NSAIDs or analgesic medications');
  write('   c) Corticosteroid injections (at least one)');
  write('   d) Weight management program (if BMI > 30)');
  y -= 4;
  write('4. BMI less than 40 kg/m2 (relative contraindication if BMI >= 40).');
  y -= 4;
  write('5. HbA1c less than 8.0% within the past 90 days for diabetic patients.');
  y -= 4;
  write('6. No active infection at the surgical site.');
  y -= 10;

  write('II. Documentation Requirements', 13, true);
  y -= 4;
  write('The following documentation must be submitted with the prior');
  write('authorization request:');
  write('- Operative report or surgical plan');
  write('- Imaging studies (X-ray or MRI) dated within 6 months');
  write('- Conservative treatment records');
  write('- Recent lab results including HbA1c (if diabetic) and CBC');
  write('- Physical therapy records documenting treatment and outcomes');
  y -= 10;

  write('III. Experimental / Not Medically Necessary', 13, true);
  y -= 4;
  write('TKA is considered not medically necessary when:');
  write('- Conservative treatment has not been attempted for at least 3 months');
  write('- The patient has an active knee infection');
  write('- BMI exceeds 45 (absolute contraindication)');

  const bytes = await doc.save();
  const outDir = path.join(__dirname, '../../test-data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'aetna-tka-policy.pdf');
  fs.writeFileSync(outPath, bytes);
  console.log(`Generated: ${outPath}`);
}

generatePolicyPdf().catch(console.error);
