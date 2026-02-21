import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchPatients } from "@/lib/api";
import type { Patient } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, User, X } from "lucide-react";

interface Props {
  selected: Patient | null;
  onSelect: (p: Patient) => void;
  onClear: () => void;
}

export default function PatientSearch({ selected, onSelect, onClear }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["patients", query],
    queryFn: () => searchPatients(query),
    enabled: query.length >= 2,
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (selected) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Patient Selected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">{selected.name}</p>
              <p className="text-sm text-muted-foreground">DOB: {selected.dob}</p>
              <Badge variant="secondary" className="mt-1">{selected.payer}</Badge>
            </div>
            <button
              onClick={onClear}
              className="rounded-full p-1.5 hover:bg-muted transition-colors"
              aria-label="Clear selection"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          Patient Selection
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative" ref={ref}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patient name..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => query.length >= 2 && setOpen(true)}
            className="pl-9"
          />
          {open && results.length > 0 && (
            <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
              {results.map((p) => (
                <button
                  key={p.id}
                  className="w-full text-left px-3 py-2.5 hover:bg-accent transition-colors first:rounded-t-md last:rounded-b-md"
                  onClick={() => {
                    onSelect(p);
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  <span className="font-medium text-sm">{p.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">DOB: {p.dob}</span>
                </button>
              ))}
            </div>
          )}
          {open && query.length >= 2 && results.length === 0 && !isFetching && (
            <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg px-3 py-2.5 text-sm text-muted-foreground">
              No patients found.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
