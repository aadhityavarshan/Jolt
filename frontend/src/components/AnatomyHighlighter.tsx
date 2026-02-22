import { Activity } from "lucide-react";
import skeletonImg from "@/assets/skeleton-front.png";
import organsImg from "@/assets/organs-front.png";

// ── Body‑region type ─────────────────────────────────────────────────
type BodyRegion =
  | "head"
  | "neck"
  | "shoulders"
  | "chest"
  | "abdomen"
  | "pelvis"
  | "upperArms"
  | "forearms"
  | "hands"
  | "thighs"
  | "knees"
  | "shins"
  | "feet"
  | "spine"
  | "heart"
  | "lungs"
  | "eyes"
  | "wholeBody";

type AnatomyModel = "skeleton" | "organs";

const REGION_LABELS: Record<BodyRegion, string> = {
  head: "Head / Brain",
  neck: "Neck / Throat",
  shoulders: "Shoulders",
  chest: "Chest",
  abdomen: "Abdomen",
  pelvis: "Hip / Pelvis",
  upperArms: "Upper Arms",
  forearms: "Elbows / Forearms",
  hands: "Wrists / Hands",
  thighs: "Thighs",
  knees: "Knees",
  shins: "Lower Legs",
  feet: "Ankles / Feet",
  spine: "Spine",
  heart: "Heart",
  lungs: "Lungs",
  eyes: "Eyes",
  wholeBody: "Whole Body",
};

// ── CPT codes that target organs (show organs model) ─────────────────
const ORGAN_CPT_CODES = new Set([
  // Cardiac
  "33533", "33534", "92928", "33361", "33249", "33208",
  // GI / Bariatric
  "43775", "43644", "43239", "45380",
  // Urology
  "55840", "52000",
  // Pulmonary
  "32663", "94660",
  // ENT (tonsils)
  "42820",
  // Ophthalmology
  "66984", "67028",
  // Neurology / Neurosurgery
  "64581", "61510", "95819", "62323",
  // Oncology
  "96413", "96417", "77385", "77386", "38222",
  // Imaging (organ-focused)
  "70553", "74177", "71260", "78816", "77067",
]);

// Organ-related regions — if ALL highlighted regions are in this set, use organs model
const ORGAN_REGIONS = new Set<BodyRegion>([
  "heart", "lungs", "abdomen", "eyes", "head", "neck", "pelvis", "chest",
]);

// Determine which anatomy model to show
function pickModel(cptCode: string | undefined, regions: Set<BodyRegion>, label: string | null): AnatomyModel {
  // CPT exact match takes priority
  if (cptCode && ORGAN_CPT_CODES.has(cptCode)) return "organs";

  // If every highlighted region is organ-related, show organs
  if (regions.size > 0 && Array.from(regions).every((r) => ORGAN_REGIONS.has(r))) {
    // But only if the label hints at soft-tissue / organ work
    const lower = (label ?? "").toLowerCase();
    const organKeywords = [
      "heart", "cardiac", "coronary", "valve", "bypass", "stent", "pacemaker",
      "lung", "pulmonary", "lobectomy", "bronch",
      "stomach", "gastric", "gastro", "bowel", "colon", "intestin", "bariatric",
      "liver", "gallbladder", "endoscopy", "colonoscopy",
      "prostate", "bladder", "cystoscopy", "prostatectomy",
      "tonsil", "adenoid",
      "eye", "cataract", "retinal", "macular", "ophthalm",
      "brain", "craniotomy", "eeg", "seizure", "vagus",
      "chemo", "radiation", "infusion", "oncology", "cancer",
      "marrow", "biopsy",
    ];
    if (organKeywords.some((kw) => lower.includes(kw))) return "organs";
  }

  return "skeleton";
}

// ── Overlay positions for SKELETON image ─────────────────────────────
const SKELETON_OVERLAYS: Record<BodyRegion, { top: number; left: number; width: number; height: number; borderRadius?: string }> = {
  head:      { top: 0,   left: 33, width: 34, height: 12, borderRadius: "50%" },
  eyes:      { top: 4.5, left: 38, width: 24, height: 3,  borderRadius: "30%" },
  neck:      { top: 11,  left: 3, width: 20, height: 5,  borderRadius: "20%" },
  shoulders: { top: 16,  left: 16, width: 64, height: 6,  borderRadius: "10%" },
  chest:     { top: 18,  left: 30, width: 40, height: 14, borderRadius: "10%" },
  heart:     { top: 20,  left: 40, width: 16, height: 8,  borderRadius: "50%" },
  lungs:     { top: 18,  left: 24, width: 52, height: 14, borderRadius: "15%" },
  spine:     { top: 12,  left: 44, width: 10, height: 40, borderRadius: "20%" },
  abdomen:   { top: 32,  left: 30, width: 40, height: 12, borderRadius: "10%" },
  pelvis:    { top: 40,  left: 26, width: 48, height: 10, borderRadius: "10%" },
  upperArms: { top: 18,  left: 14, width: 72, height: 14, borderRadius: "10%" },
  forearms:  { top: 32,  left: 8,  width: 84, height: 14, borderRadius: "10%" },
  hands:     { top: 46,  left: 4,  width: 92, height: 8,  borderRadius: "10%" },
  thighs:    { top: 50,  left: 26, width: 48, height: 16, borderRadius: "10%" },
  knees:     { top: 64,  left: 28, width: 44, height: 8,  borderRadius: "40%" },
  shins:     { top: 71,  left: 28, width: 44, height: 16, borderRadius: "10%" },
  feet:      { top: 87,  left: 24, width: 52, height: 10, borderRadius: "10%" },
  wholeBody: { top: 0,   left: 4,  width: 92, height: 98, borderRadius: "10%" },
};

// ── Overlay positions for ORGANS image ───────────────────────────────
const ORGANS_OVERLAYS: Record<BodyRegion, { top: number; left: number; width: number; height: number; borderRadius?: string }> = {
  head:      { top: 0,   left: 33, width: 34, height: 12, borderRadius: "50%" },
  eyes:      { top: 5.5, left: 40, width: 24, height: 3,  borderRadius: "30%" },
  neck:      { top: 11,  left: 42, width: 20, height: 5,  borderRadius: "20%" },
  shoulders: { top: 14,  left: 18, width: 64, height: 6,  borderRadius: "10%" },
  chest:     { top: 18,  left: 28, width: 44, height: 14, borderRadius: "10%" },
  heart:     { top: 25,  left: 48, width: 13, height: 7,  borderRadius: "50%" },
  lungs:     { top: 17,  left: 22, width: 56, height: 15, borderRadius: "15%" },
  spine:     { top: 12,  left: 42, width: 10, height: 40, borderRadius: "20%" },
  abdomen:   { top: 32,  left: 28, width: 44, height: 14, borderRadius: "10%" },
  pelvis:    { top: 44,  left: 26, width: 48, height: 10, borderRadius: "10%" },
  upperArms: { top: 18,  left: 14, width: 72, height: 14, borderRadius: "10%" },
  forearms:  { top: 32,  left: 8,  width: 84, height: 14, borderRadius: "10%" },
  hands:     { top: 46,  left: 4,  width: 92, height: 8,  borderRadius: "10%" },
  thighs:    { top: 52,  left: 26, width: 48, height: 16, borderRadius: "10%" },
  knees:     { top: 66,  left: 28, width: 44, height: 8,  borderRadius: "40%" },
  shins:     { top: 73,  left: 28, width: 44, height: 14, borderRadius: "10%" },
  feet:      { top: 87,  left: 24, width: 52, height: 10, borderRadius: "10%" },
  wholeBody: { top: 0,   left: 4,  width: 92, height: 98, borderRadius: "10%" },
};

// ── Keyword → region mapping ─────────────────────────────────────────
const KEYWORD_MAP: Array<{ regions: BodyRegion[]; keywords: string[] }> = [
  { regions: ["head"], keywords: ["brain", "cranial", "intracranial", "head", "craniotomy", "eeg", "skull"] },
  { regions: ["eyes"], keywords: ["eye", "cataract", "retinal", "macular", "intravitreal", "ophthalm", "iol", "vision", "lens"] },
  { regions: ["neck"], keywords: ["cervical", "neck", "c-spine", "tonsil", "septoplasty", "nasal", "septum", "ent", "vagus"] },
  { regions: ["spine"], keywords: ["spine", "spinal", "lumbar", "thoracic", "laminectomy", "fusion", "disc", "vertebr"] },
  { regions: ["shoulders"], keywords: ["shoulder", "rotator cuff", "glenohumeral", "clavicle", "scapula", "labr"] },
  { regions: ["forearms"], keywords: ["elbow", "ulna", "radius"] },
  { regions: ["hands"], keywords: ["wrist", "hand", "carpal", "finger"] },
  { regions: ["chest", "lungs"], keywords: ["lung", "pulmonary", "chest", "thorax", "lobectomy", "bronch"] },
  { regions: ["heart"], keywords: ["heart", "cardiac", "coronary", "bypass", "cabg", "valve", "aortic", "stent", "pacemaker", "defibrillator", "icd", "tavr", "echocardiogram", "catheterization"] },
  { regions: ["abdomen"], keywords: ["abdomen", "abdominal", "stomach", "gastric", "gastro", "liver", "gallbladder", "bowel", "colon", "intestin", "endoscopy", "colonoscopy", "bariatric", "sleeve", "gi "] },
  { regions: ["pelvis"], keywords: ["hip", "pelvis", "pelvic", "femoral", "acetabular", "prostate", "bladder", "uterus", "ovary", "cystoscopy", "prostatectomy"] },
  { regions: ["thighs"], keywords: ["femur", "femoral shaft", "thigh"] },
  { regions: ["knees"], keywords: ["knee", "patella", "meniscus", "meniscectomy", "acl", "pcl", "arthroplasty", "arthroscop"] },
  { regions: ["shins"], keywords: ["tibia", "fibula", "shin", "lower leg"] },
  { regions: ["feet"], keywords: ["ankle", "foot", "heel", "achilles", "toe", "plantar", "tarsal"] },
];

// ── CPT code → region overrides ──────────────────────────────────────
const CPT_REGION_MAP: Record<string, BodyRegion[]> = {
  "27447": ["knees"],
  "27130": ["pelvis"],
  "29881": ["knees"],
  "27446": ["knees"],
  "22551": ["neck", "spine"],
  "22612": ["spine"],
  "23472": ["shoulders"],
  "27702": ["feet"],
  "33533": ["heart"],
  "33534": ["heart"],
  "92928": ["heart"],
  "33361": ["heart"],
  "33249": ["heart"],
  "33208": ["heart"],
  "70553": ["head"],
  "73721": ["knees"],
  "73221": ["shoulders"],
  "72148": ["spine"],
  "74177": ["abdomen", "pelvis"],
  "71260": ["chest", "lungs"],
  "78816": ["wholeBody"],
  "77067": ["chest"],
  "96413": ["chest"],
  "96417": ["chest"],
  "77385": ["chest", "abdomen"],
  "77386": ["chest", "abdomen"],
  "38222": ["pelvis"],
  "64581": ["neck"],
  "61510": ["head"],
  "95819": ["head"],
  "62323": ["spine"],
  "43775": ["abdomen"],
  "43644": ["abdomen"],
  "43239": ["abdomen"],
  "45380": ["abdomen"],
  "55840": ["pelvis"],
  "52000": ["pelvis"],
  "32663": ["chest", "lungs"],
  "94660": ["chest", "lungs"],
  "42820": ["neck"],
  "30520": ["head"],
  "66984": ["eyes"],
  "67028": ["eyes"],
  "97110": ["knees", "shoulders", "spine"],
  "97140": ["spine", "shoulders"],
  "81162": [],
  "81225": [],
};

// ── Resolve highlighted regions ──────────────────────────────────────
function getHighlightedRegions(label: string | null, cptCode?: string): Set<BodyRegion> {
  const result = new Set<BodyRegion>();

  if (cptCode && CPT_REGION_MAP[cptCode]) {
    CPT_REGION_MAP[cptCode].forEach((r) => result.add(r));
    if (result.size > 0) return result;
  }

  if (!label) return result;
  const lower = label.toLowerCase();
  for (const rule of KEYWORD_MAP) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      rule.regions.forEach((r) => result.add(r));
    }
  }
  return result;
}

interface Props {
  procedureLabel: string | null;
  cptCode?: string;
}

export default function AnatomyHighlighter({ procedureLabel, cptCode }: Props) {
  const highlighted = getHighlightedRegions(procedureLabel, cptCode);
  const model = pickModel(cptCode, highlighted, procedureLabel);

  const imgSrc = model === "organs" ? organsImg : skeletonImg;
  const imgAlt = model === "organs" ? "Human organs front view" : "Human skeleton front view";
  const overlays = model === "organs" ? ORGANS_OVERLAYS : SKELETON_OVERLAYS;

  const labels = [...new Set(
    Array.from(highlighted).map((r) => REGION_LABELS[r])
  )];

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Activity className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold">Targeted Body Area</h4>
      </div>

      <div className="flex flex-col items-center">
        {/* Model label */}
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
          {model === "organs" ? "Organs View" : "Skeletal View"}
        </span>

        {/* Anatomy image with highlight overlays */}
        <div className="relative w-full max-w-[200px]">
          <img
            src={imgSrc}
            alt={imgAlt}
            className="w-full h-auto opacity-70"
            style={{ mixBlendMode: "multiply" }}
            draggable={false}
          />

          {/* Highlight overlays positioned on top of the image */}
          {(Object.entries(overlays) as [BodyRegion, typeof overlays[BodyRegion]][]).map(
            ([region, pos]) => {
              const isActive = highlighted.has(region);
              if (!isActive) return null;

              // Cyan/teal for organs (contrasts with red/pink organs), red for skeleton
              const color = model === "organs"
                ? { bg: "rgba(0, 210, 210, 0.45)", border: "rgba(0, 210, 210, 0.85)", glow: "rgba(0, 210, 210, 0.55)" }
                : { bg: "rgba(239, 68, 68, 0.45)", border: "rgba(239, 68, 68, 0.8)", glow: "rgba(239, 68, 68, 0.5)" };

              return (
                <div
                  key={region}
                  className="absolute animate-pulse pointer-events-none"
                  style={{
                    top: `${pos.top}%`,
                    left: `${pos.left}%`,
                    width: `${pos.width}%`,
                    height: `${pos.height}%`,
                    borderRadius: pos.borderRadius ?? "10%",
                    backgroundColor: color.bg,
                    border: `2px solid ${color.border}`,
                    boxShadow: `0 0 16px ${color.glow}`,
                    transition: "all 0.3s ease",
                  }}
                />
              );
            }
          )}
        </div>

        {/* Region labels */}
        {labels.length > 0 ? (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {labels.map((label) => (
              <span
                key={label}
                className="inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
              >
                {label}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground text-center">
            No specific body region for this procedure.
          </p>
        )}
      </div>
    </div>
  );
}
