import type { EvidenceQuote } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";

interface Props {
  quote: EvidenceQuote;
}

export default function EvidenceQuoteCard({ quote }: Props) {
  return (
    <Card className="bg-muted/50 border-border/60 transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5 animate-fade-in-up">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Quote className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm italic leading-relaxed">"{quote.text}"</p>
            <p className="text-xs text-muted-foreground">
              {quote.source}
              {quote.page != null && <span> · Page {quote.page}</span>}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
