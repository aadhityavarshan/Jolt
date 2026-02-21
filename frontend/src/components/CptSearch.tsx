import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchProcedures } from "@/lib/api";
import type { Procedure, Laterality } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Stethoscope } from "lucide-react";

interface Props {
  selected: Procedure | null;
  laterality: Laterality;
  onSelect: (p: Procedure) => void;
  onLateralityChange: (l: Laterality) => void;
}

export default function CPTSearch({ selected, laterality, onSelect, onLateralityChange }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: results = [] } = useQuery({
    queryKey: ["procedures", query],
    queryFn: () => searchProcedures(query),
    enabled: query.length >= 2,
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-primary" />
          Procedure Selection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* CPT Search */}
        <div className="relative" ref={ref}>
          <Input
            placeholder="Search by CPT code or procedure name..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => query.length >= 2 && setOpen(true)}
          />
          {open && results.length > 0 && (
            <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
              {results.map((p) => (
                <button
                  key={p.cptCode}
                  className="w-full text-left px-3 py-2.5 hover:bg-accent transition-colors first:rounded-t-md last:rounded-b-md"
                  onClick={() => {
                    onSelect(p);
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  <span className="font-medium text-sm">{p.label}</span>
                  <span className="text-xs text-muted-foreground ml-2">CPT {p.cptCode}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Laterality */}
        {selected?.hasLaterality && (
          <div className="space-y-2">
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
      </CardContent>
    </Card>
  );
}
