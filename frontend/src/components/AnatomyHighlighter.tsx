import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import skeletonImg from "@/assets/skeleton-front.png";
import organsImg from "@/assets/organs-front.png";

type RegionConfig = {
  id: string;
  label: string;
};

const REGIONS: RegionConfig[] = [
  { id: "brain", label: "Brain" },
  { id: "sinus", label: "Sinuses" },
  { id: "cervicalSpine", label: "Cervical Spine" },
  { id: "thoracicSpine", label: "Thoracic Spine" },
  { id: "lumbarSpine", label: "Lumbar Spine" },
  { id: "leftShoulder", label: "Shoulder" },
  { id: "rightShoulder", label: "Shoulder" },
  { id: "elbow", label: "Elbow" },
  { id: "wristHand", label: "Wrist / Hand" },
  { id: "hipPelvis", label: "Hip / Pelvis" },
  { id: "leftKnee", label: "Knee" },
  { id: "rightKnee", label: "Knee" },
  { id: "ankleFoot", label: "Ankle / Foot" },
  { id: "heart", label: "Heart" },
  { id: "lungs", label: "Lungs" },
  { id: "liver", label: "Liver" },
  { id: "stomach", label: "Stomach" },
  { id: "kidney", label: "Kidneys" },
  { id: "bowel", label: "Bowel" },
  { id: "bladder", label: "Bladder" },
  { id: "uterusProstate", label: "Pelvic Organs" },
];

const REGION_KEYWORDS: Array<{ regionIds: string[]; keywords: string[] }> = [
  { regionIds: ["brain"], keywords: ["brain", "cranial", "intracranial", "head"] },
  { regionIds: ["sinus"], keywords: ["sinus", "maxillary", "ethmoid", "frontal sinus"] },
  { regionIds: ["cervicalSpine"], keywords: ["cervical", "neck", "c-spine"] },
  { regionIds: ["thoracicSpine"], keywords: ["thoracic", "t-spine"] },
  { regionIds: ["lumbarSpine"], keywords: ["lumbar", "l-spine", "sacral", "sacroiliac"] },
  { regionIds: ["leftShoulder", "rightShoulder"], keywords: ["shoulder", "clavicle", "scapula", "rotator cuff"] },
  { regionIds: ["elbow"], keywords: ["elbow", "humerus", "ulna", "radius"] },
  { regionIds: ["wristHand"], keywords: ["wrist", "hand", "carpal", "finger", "metacarpal", "thumb"] },
  { regionIds: ["hipPelvis"], keywords: ["hip", "pelvis", "pelvic", "femoral", "acetabular"] },
  { regionIds: ["leftKnee", "rightKnee"], keywords: ["knee", "patella", "meniscus", "acl", "pcl"] },
  { regionIds: ["ankleFoot"], keywords: ["ankle", "foot", "heel", "achilles", "toe", "plantar"] },
  { regionIds: ["heart"], keywords: ["heart", "cardiac", "cardio", "coronary"] },
  { regionIds: ["lungs"], keywords: ["lung", "pulmonary", "respiratory", "chest", "thorax", "bronch"] },
  { regionIds: ["liver"], keywords: ["liver", "hepatic", "gallbladder", "biliary"] },
  { regionIds: ["stomach"], keywords: ["stomach", "gastric", "esophagus", "upper gi"] },
  { regionIds: ["kidney"], keywords: ["kidney", "renal", "nephro", "ureter"] },
  { regionIds: ["bowel"], keywords: ["abdomen", "abdominal", "bowel", "colon", "intestinal", "gi", "appendix"] },
  { regionIds: ["bladder"], keywords: ["bladder", "urinary", "cyst"] },
  { regionIds: ["uterusProstate"], keywords: ["uterus", "ovary", "prostate", "gynec", "obstetric", "reproductive"] },
];

interface Props {
  procedureLabel: string | null;
}

function getHighlightedRegions(label: string | null): RegionConfig[] {
  if (!label) return [];
  const normalized = label.toLowerCase();
  const matchedIds = new Set<string>();

  for (const rule of REGION_KEYWORDS) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) {
      for (const regionId of rule.regionIds) {
        matchedIds.add(regionId);
      }
    }
  }

  return REGIONS.filter((region) => matchedIds.has(region.id));
}

export default function AnatomyHighlighter({ procedureLabel }: Props) {
  const highlightedRegions = getHighlightedRegions(procedureLabel);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Anatomy View
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1 animate-float">
          <div className="relative flex flex-col items-center">
            <p className="text-xs font-medium text-muted-foreground mb-2">Skeletal</p>
            <div className="relative w-full max-w-[200px] h-[500px] overflow-hidden rounded-md">
              <img src={skeletonImg} alt="Skeleton front view" className="w-full h-full object-contain" />
            </div>
          </div>

          <div className="relative flex flex-col items-center">
            <p className="text-xs font-medium text-muted-foreground mb-2">Organs</p>
            <div className="relative w-full max-w-[200px] h-[500px] overflow-hidden rounded-md">
              <img src={organsImg} alt="Organs front view" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>

        {highlightedRegions.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {[...new Map(highlightedRegions.map((region) => [region.label, region])).values()].map((region) => (
              <span
                key={`label-${region.id}`}
                className="inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
              >
                {region.label}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
