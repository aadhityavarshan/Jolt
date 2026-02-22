// CPT code to clinical description mapping
// Only includes codes from the Jolt CPT database
export const procedureDescriptions: Record<string, string> = {
  // ========== ORTHOPEDIC PROCEDURES ==========
  "27447": "Knee replacement surgery where the damaged knee joint is replaced with an artificial joint to relieve pain and restore movement.",
  "27130": "Hip replacement surgery where the damaged hip joint is replaced with an artificial joint to reduce pain and improve mobility.",
  "29881": "Arthroscopic knee surgery using a small camera to remove or repair torn cartilage (meniscus) in the knee.",
  "27446": "Revision knee replacement surgery to remove and replace a previously installed artificial knee joint that is no longer working properly.",
  "22551": "Neck spine surgery where bones are fused together to stabilize the spine and reduce nerve pressure and pain.",
  "22612": "Lower back spine surgery where bones are fused together to stabilize the spine and relieve pressure on nerves and spinal cord.",
  "23472": "Shoulder replacement surgery where the damaged shoulder joint is replaced with an artificial joint to relieve pain and improve arm movement.",
  "27702": "Ankle replacement surgery where the damaged ankle joint is replaced with an artificial joint to reduce pain and improve walking ability.",

  // ========== CARDIAC PROCEDURES ==========
  "33533": "Heart bypass surgery where a natural vein is grafted to bypass one blocked coronary artery and restore blood flow to the heart.",
  "33534": "Heart bypass surgery where multiple natural veins are grafted to bypass two or more blocked coronary arteries.",
  "92928": "Heart catheterization procedure where a stent (tiny tube) is placed inside a blocked or narrowed artery to restore blood flow to the heart.",
  "33361": "Minimally invasive valve replacement surgery where a new heart valve is inserted through blood vessels to replace a damaged aortic valve.",
  "33249": "Implantation of a device that monitors heart rhythm and delivers electrical shocks if dangerous heart rhythms are detected.",
  "33208": "Implantation of a pacemaker device that helps regulate heart rhythm by sending electrical signals to the heart muscle.",

  // ========== IMAGING PROCEDURES ==========
  "70553": "Detailed brain scan using magnetic resonance imaging with and without contrast dye to detect tumors, bleeding, strokes, and structural problems.",
  "73721": "Knee scan using magnetic resonance imaging to visualize cartilage, ligaments, and other internal knee structures.",
  "73221": "Shoulder scan using magnetic resonance imaging to examine rotator cuff tendons, cartilage, and shoulder joint structures.",
  "72148": "Lower spine scan using magnetic resonance imaging to check for disc problems, nerve compression, and spinal narrowing.",
  "74177": "Detailed scan of the abdomen and pelvis using CT imaging with contrast dye to identify tumors, injuries, infections, or organ problems.",
  "71260": "Detailed chest scan using CT imaging with contrast dye to evaluate lung nodules, infections, and chest structures.",
  "78816": "Whole body scan using a special imaging technique to detect cancer spread or check for recurrence of cancer.",
  "77067": "X-ray imaging of both breasts to screen for breast cancer.",

  // ========== ONCOLOGY PROCEDURES ==========
  "96413": "Administration of cancer-fighting drugs through an IV (needle and tube into a vein) for the first hour of treatment.",
  "96417": "Continued administration of cancer-fighting drugs through an IV for each additional hour of treatment beyond the first hour.",
  "77385": "Targeted radiation therapy for cancer treatment where radiation beams are carefully shaped to match the tumor.",
  "77386": "Advanced radiation therapy for cancer using multiple detailed treatment plans to target the tumor more precisely.",
  "38222": "Bone marrow sample collection using a needle to test for blood cancers, low blood counts, or bone marrow disorders.",

  // ========== NEUROLOGY/NEUROSURGERY PROCEDURES ==========
  "64581": "Implantation of a device that sends electrical signals to a nerve in the neck to help control severe seizures or depression.",
  "61510": "Brain surgery where the skull is opened to remove a tumor or abnormal mass from inside the brain.",
  "95819": "Brain wave test during sleep to diagnose seizures, sleep disorders, and other brain conditions.",
  "62323": "Injection of anti-inflammatory medication around the nerves in the lower back to reduce pain and numbness.",

  // ========== GASTROINTESTINAL/BARIATRIC PROCEDURES ==========
  "43775": "Weight loss surgery where part of the stomach is removed through small incisions to reduce stomach size and food intake.",
  "43644": "Weight loss surgery where the stomach is made smaller and the small intestine is rerouted to bypass part of the stomach and reduce calorie absorption.",
  "43239": "Camera examination of the throat, stomach, and upper small intestine with tissue sampling to check for ulcers, infections, or cancer.",
  "45380": "Camera examination of the colon and rectum with tissue sampling to screen for colorectal cancer or other bowel problems.",

  // ========== UROLOGY PROCEDURES ==========
  "55840": "Surgical removal of the prostate gland and surrounding tissues for prostate cancer treatment.",
  "52000": "Camera examination of the bladder and urethra to investigate blood in urine or bladder problems.",

  // ========== PULMONARY PROCEDURES ==========
  "32663": "Lung cancer surgery using small incisions and a camera to remove part of the lung.",
  "94660": "Setup and management of a breathing machine that keeps airways open during sleep to treat sleep apnea.",

  // ========== ENT PROCEDURES ==========
  "42820": "Surgical removal of tonsils in children for repeated sore throats or breathing problems.",
  "30520": "Nasal surgery to straighten a deviated septum (the wall between nostrils) to improve breathing.",

  // ========== OPHTHALMOLOGY PROCEDURES ==========
  "66984": "Eye surgery to remove a cloudy lens (cataract) and replace it with an artificial lens to restore vision.",
  "67028": "Injection of medication directly into the eye to treat age-related macular degeneration, diabetic eye disease, or other retinal problems.",

  // ========== PHYSICAL THERAPY/REHABILITATION ==========
  "97110": "Exercise and rehabilitation program to improve joint movement, strength, and daily functioning.",
  "97140": "Hands-on physical therapy including stretching, joint mobilization, and massage to reduce pain and improve movement.",

  // ========== DURABLE MEDICAL EQUIPMENT/DEVICES ==========
  "L8614": "Implanted device that converts sound into electrical signals sent to the brain to restore hearing in severely deaf individuals.",
  "E0601": "Breathing machine that continuously delivers air pressure to keep airways open during sleep for sleep apnea patients.",
  "L8690": "Hearing aid device that is surgically attached to the skull bone to transmit sound vibrations directly to the inner ear.",

  // ========== GENETIC TESTING ==========
  "81162": "Genetic test to check if you carry mutations that increase risk for breast and ovarian cancer.",
  "81225": "Genetic test to determine how your body processes certain medications to predict how well drugs will work for you.",
};

export function getProcedureDescription(cptCode: string | undefined, fallbackLabel: string): string {
  if (!cptCode) return getDefaultDescription(fallbackLabel);
  
  // Try exact CPT code match first
  const exact = procedureDescriptions[cptCode];
  if (exact) return exact;
  
  // Fall back to keyword-based description
  return getDefaultDescription(fallbackLabel);
}

function getDefaultDescription(label: string): string {
  const lower = label.toLowerCase();
  
  // Imaging - detailed
  if (lower.includes("x-ray") || lower.includes("radiograph"))
    return "Radiographic imaging procedure using ionizing radiation to capture images of skeletal structures, joints, and soft tissues for diagnosis of fractures, arthritis, and pathology.";
  if (lower.includes("mri") || lower.includes("magnetic resonance"))
    return "Advanced magnetic resonance imaging creating detailed cross-sectional images of soft tissues, organs, neural structures, and cartilage without ionizing radiation exposure.";
  if (lower.includes("ct") || lower.includes("computed tomography"))
    return "High-resolution volumetric imaging providing detailed cross-sectional views for comprehensive evaluation of bone, soft tissue, and organ pathology.";
  if (lower.includes("ultrasound") || lower.includes("sonography"))
    return "Real-time dynamic ultrasound imaging using sound waves to visualize soft tissues, tendons, ligaments, and blood flow without radiation exposure.";
  if (lower.includes("pet"))
    return "Positron emission tomography imaging metabolic activity to identify areas of abnormal cellular function and disease activity.";
  if (lower.includes("pet/ct") || lower.includes("pet-ct"))
    return "Combined metabolic and anatomical imaging integrating PET and CT for comprehensive evaluation of systemic disease and treatment response.";
  
  // Joint/Orthopedic Procedures
  if (lower.includes("arthroplasty") || lower.includes("replacement"))
    return "Joint replacement surgery involving removal of damaged cartilage and bone with surgical placement of prosthetic implant to restore joint function and reduce pain.";
  if (lower.includes("arthroscopy"))
    return "Minimally invasive arthroscopic surgery using a fiber-optic camera and specialized instruments for direct visualization and treatment of intra-articular pathology.";
  if (lower.includes("arthrotomy"))
    return "Open surgical approach to joint for treatment of ligamentous, meniscal, or cartilage pathology.";
  if (lower.includes("meniscectomy"))
    return "Arthroscopic or open surgical removal of torn meniscal tissue to restore knee mechanics and reduce symptoms.";
  if (lower.includes("meniscal repair") || lower.includes("meniscus repair"))
    return "Surgical repair of meniscal tear using sutures or anchors to preserve tissue and maintain joint function.";
  if (lower.includes("acl") || lower.includes("anterior cruciate ligament"))
    return "Ligament reconstruction surgery restoring anterior cruciate ligament integrity through autograft or allograft placement for knee stability.";
  if (lower.includes("pcl") || lower.includes("posterior cruciate ligament"))
    return "Surgical reconstruction of posterior cruciate ligament to restore posterior knee stability and prevent excessive translation.";
  if (lower.includes("collateral ligament") || lower.includes("mcl") || lower.includes("lcl"))
    return "Repair or reconstruction of medial or lateral collateral ligament to restore knee stability and prevent valgus/varus instability.";
  
  // Spine Surgery
  if (lower.includes("laminectomy"))
    return "Spinal decompression surgery involving removal of lamina to relieve neural compression and address stenosis or radiculopathy.";
  if (lower.includes("discectomy") || lower.includes("disc removal"))
    return "Surgical removal of herniated disc material compressing spinal nerves to alleviate radicular pain and neurological symptoms.";
  if (lower.includes("fusion") || lower.includes("arthrodesis"))
    return "Spinal fusion procedure permanently joining two or more vertebrae with bone graft and/or internal fixation for stabilization.";
  if (lower.includes("corpectomy"))
    return "Surgical removal of vertebral body for decompression and fusion in cases of severe stenosis or tumor.";
  
  // Soft Tissue Surgery
  if (lower.includes("rotator cuff repair"))
    return "Surgical repair of rotator cuff tendon tears via open or arthroscopic approach to restore shoulder stability and function.";
  if (lower.includes("tendon repair") || lower.includes("tenorrhaphy"))
    return "Surgical repair or reattachment of torn tendon to restore force transmission and functional mobility.";
  if (lower.includes("tenodesis"))
    return "Surgical procedure stabilizing tendon by anchoring to bone to prevent subluxation and restore joint stability.";
  if (lower.includes("ligament repair") || lower.includes("ligament reconstruction"))
    return "Surgical restoration of ligament integrity through direct repair or reconstruction with autograft/allograft material.";
  if (lower.includes("labral repair") || lower.includes("labrum"))
    return "Surgical repair of labral tears using suture anchors or reattachment technique to restore glenohumeral stability.";
  
  // Injection Procedures
  if (lower.includes("injection") && (lower.includes("image") || lower.includes("guided")))
    return "Image-guided injection procedure using ultrasound or fluoroscopy for precise delivery of therapeutic medication to target tissue with reduced discomfort.";
  if (lower.includes("injection"))
    return "Therapeutic injection procedure delivering corticosteroids, biologics, or anesthetic to reduce inflammation and pain.";
  if (lower.includes("arthrocentesis") || lower.includes("aspiration"))
    return "Joint aspiration procedure using needle puncture to collect synovial fluid for diagnostic analysis or therapeutic evacuation.";
  if (lower.includes("bursa"))
    return "Bursa injection or aspiration procedure for treatment of bursitis with therapeutic medication or diagnostic fluid collection.";
  
  // Nerve Procedures
  if (lower.includes("nerve block"))
    return "Minimally invasive procedure injecting anesthetic or therapeutic medication around target nerves to provide pain relief and analgesia.";
  if (lower.includes("nerve decompression"))
    return "Surgical release of nerve compression through removal of constraining tissue to alleviate neurological symptoms.";
  if (lower.includes("neurectomy"))
    return "Surgical removal or resection of diseased nerve tissue for pain management.";
  
  // Therapy
  if (lower.includes("physical therapy") || lower.includes("pt"))
    return "Physical therapy program using therapeutic exercises, manual techniques, and modalities to restore function, improve mobility, and reduce pain.";
  if (lower.includes("occupational therapy") || lower.includes("ot"))
    return "Occupational therapy focusing on adaptive strategies and functional activities to restore independence in activities of daily living.";
  if (lower.includes("rehabilitation"))
    return "Comprehensive rehabilitation program addressing functional deficits through exercise, therapy, and adaptive training.";
  
  return "A medical procedure to diagnose or treat the patient's condition.";
}
