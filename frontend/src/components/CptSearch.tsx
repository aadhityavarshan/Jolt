import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchProcedures } from "@/lib/api";
import type { Procedure, Laterality } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Stethoscope, X } from "lucide-react";
import AnatomyHighlighter from "./AnatomyHighlighter";
import { getProcedureDescription } from "@/lib/procedureDescriptions";

interface Props {
  selected: Procedure | null;
  laterality: Laterality;
  onSelect: (p: Procedure) => void;
  onLateralityChange: (l: Laterality) => void;
  onClearSelection?: () => void;
}

export default function CPTSearch({ selected, laterality, onSelect, onLateralityChange, onClearSelection }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fetch all procedures once on mount
  const { data: allProcedures = [] } = useQuery({
    queryKey: ["procedures", "all"],
    queryFn: () => searchProcedures(""),
    staleTime: Infinity,
  });

  // Filtered search results when user types
  const { data: searchResults = [] } = useQuery({
    queryKey: ["procedures", query],
    queryFn: () => searchProcedures(query),
    enabled: query.length >= 2,
  });

  // Show all procedures when no query, or search results when typing
  const displayResults = query.length >= 2 ? searchResults : allProcedures;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <Card className="card-hover overflow-visible">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-primary" />
          Procedure Selection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 overflow-visible">
        {/* CPT Search */}
        <div className="relative z-50" ref={ref}>
          <div className="relative">
            <Input
              placeholder="Search by CPT code or procedure name..."
              value={query}
              onChange={(e) => {
                const nextQuery = e.target.value;
                setQuery(nextQuery);
                setOpen(true);

                if (selected) {
                  const selectedText = `${selected.label} (CPT ${selected.cptCode})`;
                  if (nextQuery !== selectedText) {
                    onClearSelection?.();
                  }
                }
              }}
              onFocus={() => setOpen(true)}
              className="pr-8"
            />
            {query && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => {
                  setQuery("");
                  setOpen(false);
                  onClearSelection?.();
                }}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {open && displayResults.length > 0 && (
            <div className="absolute z-50 mt-2 w-full rounded-md border bg-popover shadow-xl animate-slide-down max-h-56 overflow-y-auto">
              {displayResults.map((p) => (
                <button
                  key={p.cptCode}
                  className="w-full text-left px-3 py-2.5 hover:bg-accent transition-colors first:rounded-t-md last:rounded-b-md text-sm"
                  onClick={() => {
                    onSelect(p);
                    setQuery(`${p.label} (CPT ${p.cptCode})`);
                    setOpen(false);
                  }}
                >
                  <span className="font-medium">{p.label}</span>
                  <span className="text-xs text-muted-foreground ml-2">CPT {p.cptCode}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Learn More Button */}
        <Button
          onClick={() => setHelpOpen(true)}
          disabled={!selected}
          className="w-full"
        >
          Learn More
        </Button>

        {/* Laterality */}
        {selected?.hasLaterality && (
          <div className="space-y-2 animate-fade-in">
            <p className="text-sm font-medium">Laterality</p>
            <ToggleGroup
              type="single"
              value={laterality}
              onValueChange={(v) => v && onLateralityChange(v as Laterality)}
              className="justify-start"
            >
              <ToggleGroupItem value="left" className="text-xs">Left</ToggleGroupItem>
              <ToggleGroupItem value="right" className="text-xs">Right</ToggleGroupItem>
              <ToggleGroupItem value="both" className="text-xs">Both</ToggleGroupItem>
            </ToggleGroup>
          </div>
        )}

        {/* Help Sheet */}
        <Sheet open={helpOpen} onOpenChange={setHelpOpen}>
          <SheetContent side="right" className="w-full sm:w-[600px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-left">Procedure Details</SheetTitle>
            </SheetHeader>
            {selected && (
              <div className="space-y-6 mt-6">
                {/* Procedure Info */}
                <div>
                  <h3 className="font-semibold text-base mb-2">{selected.label}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    <span className="text-foreground font-medium">CPT Code:</span> {selected.cptCode}
                  </p>
                  <div className="p-3 bg-muted rounded-md border border-muted-foreground/20">
                    <p className="text-sm text-foreground leading-relaxed">
                      {getProcedureDescription(selected.cptCode, selected.label)}
                    </p>
                  </div>
                </div>

                {/* Anatomy View */}
                <div className="border-t pt-6">
                  <AnatomyHighlighter procedureLabel={selected.label} cptCode={selected.cptCode} />
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </CardContent>
    </Card>
  );
}
