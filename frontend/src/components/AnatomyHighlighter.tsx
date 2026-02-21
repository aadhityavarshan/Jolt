import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import skeletonImg from "@/assets/skeleton-front.png";
import organsImg from "@/assets/organs-front.png";

const PROCEDURE_TO_REGIONS: Record<string, string[]> = {
  "Echocardiogram": ["heart"],
  "Cardiac catheterization": ["heart"],
  "Heart surgery consult": ["heart"],
  "Cervical spine MRI": ["cervicalSpine"],
  "Thoracic spine MRI": ["thoracicSpine"],
  "Lumbar spine MRI": ["lumbarSpine"],
  "Spinal fusion consult": ["cervicalSpine", "thoracicSpine", "lumbarSpine"],
};

interface Props {
  procedureLabel: string | null;
}

function getHighlightedRegions(label: string | null): string[] {
  if (!label) return [];
  return PROCEDURE_TO_REGIONS[label] ?? [];
}

const SPINE_REGIONS: Record<string, { top: string; height: string }> = {
  cervicalSpine: { top: "12%", height: "8%" },
  thoracicSpine: { top: "20%", height: "18%" },
  lumbarSpine: { top: "38%", height: "12%" },
};

export default function AnatomyHighlighter({ procedureLabel }: Props) {
  const regions = getHighlightedRegions(procedureLabel);

  const isCardiology = regions.includes("heart");
  const isSpine = regions.some((r) => r in SPINE_REGIONS);

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
          {/* Skeleton */}
          <div className="relative flex flex-col items-center">
            <p className="text-xs font-medium text-muted-foreground mb-2">Skeletal</p>
            <div className="relative w-full max-w-[200px]">
              <img
                src={skeletonImg}
                alt="Skeleton front view"
                className="w-full h-auto"
              />
              {/* Spine overlays */}
              {isSpine &&
                regions.map((r) => {
                  const pos = SPINE_REGIONS[r];
                  if (!pos) return null;
                  return (
                    <div
                      key={r}
                      className="anatomy-highlight absolute left-1/2 -translate-x-1/2 rounded-sm pointer-events-none"
                      style={{
                        top: pos.top,
                        height: pos.height,
                        width: "14%",
                        background: "hsl(200, 98%, 39%, 0.35)",
                        boxShadow: "0 0 12px 4px hsl(200, 98%, 39%, 0.25)",
                        transition: "opacity 0.3s ease",
                      }}
                    />
                  );
                })}
            </div>
          </div>

          {/* Organs */}
          <div className="relative flex flex-col items-center">
            <p className="text-xs font-medium text-muted-foreground mb-2">Organs</p>
            <div className="relative w-full max-w-[200px]">
              <img
                src={organsImg}
                alt="Organs front view"
                className="w-full h-auto"
              />
              {/* Heart glow overlay */}
              {isCardiology && (
                <div
                  className="anatomy-highlight absolute pointer-events-none rounded-full"
                  style={{
                    top: "24%",
                    left: "44%",
                    width: "22%",
                    height: "12%",
                    background: "radial-gradient(circle, hsl(48, 100%, 60%, 0.0) 30%, hsl(48, 100%, 60%, 0.0) 60%, transparent 100%)",
                    boxShadow: "0 0 18px 8px hsl(48, 100%, 55%, 0.55), 0 0 40px 16px hsl(48, 100%, 55%, 0.25)",
                    border: "2px solid hsl(48, 100%, 60%, 0.8)",
                    transition: "opacity 0.3s ease",
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
