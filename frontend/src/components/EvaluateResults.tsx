import { useState } from "react";
import type { EvaluationResult, Verdict } from "@/lib/types";
import { downloadLetter } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import EvidenceQuoteCard from "./EvidenceQuoteCard";
import { CheckCircle2, AlertTriangle, XCircle, FileText, AlertCircle, BookOpen, Download, Loader2 } from "lucide-react";

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

export default function EvaluateResults({ result }: Props) {
  const v = verdictConfig[result.verdict];
  const [letterLoading, setLetterLoading] = useState(false);
  const [letterError, setLetterError] = useState<string | null>(null);

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
    <Card>
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
        {/* Verdict Badge */}
        <div className="flex items-center gap-3 animate-fade-in-up stagger-1">
          <Badge className={v.className}>
            <span className="flex items-center gap-1.5">{v.icon} {v.label}</span>
          </Badge>
        </div>

        {/* Probability */}
        <div className="space-y-2 animate-fade-in-up stagger-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Approval Probability</span>
            <span className="font-semibold">{result.probability}%</span>
          </div>
          <Progress value={result.probability} className="h-2" />
        </div>

        {/* Why */}
        <div className="space-y-2 animate-fade-in-up stagger-3">
          <h4 className="text-sm font-semibold flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-primary" /> Why
          </h4>
          <ul className="space-y-1.5 ml-5">
            {result.reasons.map((r, i) => (
              <li key={i} className="text-sm text-muted-foreground list-disc">{r}</li>
            ))}
          </ul>
        </div>

        {/* Missing Info */}
        {result.missingInfo.length > 0 && (
          <div className="space-y-2 animate-fade-in-up stagger-4">
            <h4 className="text-sm font-semibold flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-warning" /> Missing Information
            </h4>
            <ul className="space-y-1.5 ml-5">
              {result.missingInfo.map((m, i) => (
                <li key={i} className="text-sm text-muted-foreground list-disc">{m}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Evidence */}
        {result.evidence.length > 0 && (
          <div className="space-y-3 animate-fade-in-up stagger-5">
            <h4 className="text-sm font-semibold flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-primary" /> Evidence
            </h4>
            <div className="space-y-2">
              {result.evidence.map((e, i) => (
                <EvidenceQuoteCard key={i} quote={e} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
