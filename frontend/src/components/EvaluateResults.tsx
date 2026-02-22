import { useState } from "react";
import type { EvaluationResult, ReasonWithEvidence, Verdict } from "@/lib/types";
import { downloadLetter } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CheckCircle2, AlertTriangle, XCircle, FileText, AlertCircle, Download, Loader2, ChevronDown, Quote } from "lucide-react";
import { categorizeReasons, groupReasonsByCategory, categoryConfig } from "@/lib/reasonCategories";

interface Props {
  result: EvaluationResult;
}

const verdictConfig: Record<Verdict, { label: string; className: string; icon: React.ReactNode }> = {
  YES: {
    label: "Likely Approved",
    className: "bg-success text-success-foreground text-sm px-4 py-1.5",
    icon: <CheckCircle2 className="h-5 w-5" />,
  },
  MAYBE: {
    label: "Uncertain",
    className: "bg-warning text-warning-foreground text-sm px-4 py-1.5",
    icon: <AlertTriangle className="h-5 w-5" />,
  },
  NO: {
    label: "Likely Denied",
    className: "bg-destructive text-destructive-foreground text-sm px-4 py-1.5",
    icon: <XCircle className="h-5 w-5" />,
  },
};

function ReasonBullets({ text }: { text: string }) {
  if (text.includes("•")) {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    return (
      <ul className="list-none space-y-1">
        {lines.map((line, j) => (
          <li key={j} className="flex items-start gap-1.5">
            {line.startsWith("•") ? (
              <>
                <span className="mt-0.5 shrink-0">•</span>
                <span>{line.replace(/^•\s*/, "")}</span>
              </>
            ) : (
              <span>{line}</span>
            )}
          </li>
        ))}
      </ul>
    );
  }
  return <span>{text}</span>;
}

function ReasonCard({
  reason,
  categorized,
}: {
  reason: ReasonWithEvidence;
  categorized: { category: keyof typeof categoryConfig };
}) {
  const config = categoryConfig[categorized.category];
  const hasEvidence = reason.evidence !== null;

  const content = (
    <div
      className={`p-3 rounded-md text-sm ${config.bgColor} ${
        hasEvidence ? "cursor-pointer hover:opacity-80 transition-opacity" : ""
      }`}
    >
      <div className="text-muted-foreground leading-relaxed">
        <ReasonBullets text={reason.reasoning} />
      </div>
      <div className="flex items-center gap-2 mt-2">
        <Badge variant="secondary" className={`text-xs ${config.color}`}>
          {config.label}
        </Badge>
        {hasEvidence && (
          <span className="text-xs text-muted-foreground/60 flex items-center gap-1">
            <Quote className="h-3 w-3" /> Click for evidence
          </span>
        )}
      </div>
    </div>
  );

  if (!hasEvidence) return content;

  return (
    <Popover>
      <PopoverTrigger asChild>{content}</PopoverTrigger>
      <PopoverContent className="w-96" side="bottom" align="start">
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <Quote className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-sm italic leading-relaxed">
              "{reason.evidence!.text}"
            </p>
          </div>
          <Separator />
          <p className="text-xs text-muted-foreground">
            {reason.evidence!.source}
            {reason.evidence!.page != null && (
              <span> · Page {reason.evidence!.page}</span>
            )}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function EvaluateResults({ result }: Props) {
  const v = verdictConfig[result.verdict];
  const [letterLoading, setLetterLoading] = useState(false);
  const [letterError, setLetterError] = useState<string | null>(null);
  const [expandedReasons, setExpandedReasons] = useState(false);

  const categorizedReasons = categorizeReasons(result.reasons);
  const groupedReasons = groupReasonsByCategory(categorizedReasons);
  const maxInitialReasons = 3;
  const evidenceCount = result.reasons.filter((r) => r.evidence !== null).length;

  const handleDownloadLetter = async () => {
    setLetterLoading(true);
    setLetterError(null);
    try {
      await downloadLetter(result.determinationId);
    } catch (err) {
      setLetterError(err instanceof Error ? err.message : "Failed to generate letter");
    } finally {
      setLetterLoading(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Evaluation Results
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadLetter}
            disabled={letterLoading}
          >
            {letterLoading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Download className="h-3.5 w-3.5" /> Letter of Necessity
              </span>
            )}
          </Button>
        </CardTitle>
        {letterError && (
          <p className="text-sm text-destructive mt-1">{letterError}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4 items-center">
          <Badge className={v.className}>
            <span className="flex items-center gap-1.5">{v.icon} {v.label}</span>
          </Badge>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Approval Probability</span>
              <span className="font-semibold">{result.probability}%</span>
            </div>
            <Progress value={result.probability} className="h-2" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="border-muted">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Determination ID</p>
              <p className="text-sm font-medium break-all">{result.determinationId}</p>
            </CardContent>
          </Card>
          <Card className="border-muted">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Reasons</p>
              <p className="text-sm font-medium">{result.reasons.length}</p>
            </CardContent>
          </Card>
          <Card className="border-muted">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Evidence Quotes</p>
              <p className="text-sm font-medium">{evidenceCount}</p>
            </CardContent>
          </Card>
        </div>

        <Separator />

        <Card className="border-muted bg-muted/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-warning" /> Missing Information
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-32 overflow-y-auto">
            {result.missingInfo.length > 0 ? (
              <ul className="space-y-1.5">
                {result.missingInfo.map((m, i) => (
                  <li key={i} className="text-xs text-muted-foreground leading-relaxed">
                    <span className="inline-block mr-1.5">•</span>
                    {m}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-1">No missing information detected.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-muted">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-primary" /> Supporting Reasons
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
              {result.reasons.length > 0 ? (
                <>
                  <div className="space-y-2">
                    {result.reasons
                      .slice(0, expandedReasons ? undefined : maxInitialReasons)
                      .map((reason, i) => (
                        <ReasonCard
                          key={i}
                          reason={reason}
                          categorized={categorizedReasons[i]}
                        />
                      ))}
                  </div>

                  {result.reasons.length > maxInitialReasons && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedReasons(!expandedReasons)}
                      className="w-full mt-2"
                    >
                      <ChevronDown
                        className={`h-4 w-4 mr-1.5 transition-transform ${
                          expandedReasons ? "rotate-180" : ""
                        }`}
                      />
                      {expandedReasons
                        ? "Show Less"
                        : `Show ${result.reasons.length - maxInitialReasons} More`}
                    </Button>
                  )}

                  {result.reasons.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-muted-foreground/10">
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(groupedReasons)
                          .filter(([_, reasons]) => reasons.length > 0)
                          .map(([category, reasons]) => {
                            const cat = category as keyof typeof categoryConfig;
                            return (
                              <div key={category} className="text-xs">
                                <p className="text-muted-foreground">
                                  {categoryConfig[cat].label}
                                </p>
                                <p className="font-semibold text-foreground">
                                  {reasons.length}
                                </p>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No reason details were returned.
                </p>
              )}
            </CardContent>
          </Card>
      </CardContent>
    </Card>
  );
}
