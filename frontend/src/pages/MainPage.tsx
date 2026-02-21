import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { Patient, Procedure, Laterality, EvaluationResult } from "@/lib/types";
import { evaluate, isMockMode, setMockMode } from "@/lib/api";
import PatientSearch from "@/components/PatientSearch";
import CPTSearch from "@/components/CPTSearch";
import AnatomyHighlighter from "@/components/AnatomyHighlighter";
import EvaluateResults from "@/components/EvaluateResults";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function MainPage() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [procedure, setProcedure] = useState<Procedure | null>(null);
  const [laterality, setLaterality] = useState<Laterality>("both");
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [mock, setMock] = useState(isMockMode());

  const mutation = useMutation({
    mutationFn: evaluate,
    onSuccess: (data) => setResult(data)
  });

  const canEvaluate = patient !== null && procedure !== null;

  const handleEvaluate = () => {
    if (!canEvaluate) return;
    setResult(null);
    mutation.mutate({
      patient_id: patient.id,
      cpt_code: procedure.cptCode,
      payer: patient.payer
    });
  };

  const toggleMock = (v: boolean) => {
    setMock(v);
    setMockMode(v);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card animate-fade-in">
        <div className="mx-auto max-w-[1100px] px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Jolt
              <span className="text-primary"></span>
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Prior Authorization Pre-Check

            </p>
          </div>
          <div className="flex items-center gap-4">
            





            <Link to="/admin">
              <Button variant="outline" size="sm">Admin</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[1100px] px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column: inputs */}
          <div className="space-y-6">
            <div className="animate-fade-in-up stagger-1">
            <PatientSearch
              selected={patient}
              onSelect={(p) => {setPatient(p);setResult(null);}}
              onClear={() => {setPatient(null);setResult(null);}} />
            </div>

            <div className="animate-fade-in-up stagger-2">
            <CPTSearch
              selected={procedure}
              laterality={laterality}
              onSelect={(p) => {setProcedure(p);setResult(null);}}
              onLateralityChange={setLaterality} />
            </div>

            <Button
              onClick={handleEvaluate}
              disabled={!canEvaluate || mutation.isPending}
              className="w-full h-11 animate-fade-in-up stagger-3 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]"
              size="lg">

              {mutation.isPending ?
              <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Evaluating...
                </span> :

              "Evaluate"
              }
            </Button>

            {mutation.isError &&
            <p className="text-sm text-destructive">
                Evaluation failed. Please try again.
              </p>
            }
          </div>

          {/* Right column: anatomy */}
          <div className="animate-fade-in-up stagger-2">
            <AnatomyHighlighter
              procedureLabel={procedure?.label ?? null} />

          </div>
        </div>

        {/* Results */}
        {result &&
        <div className="mt-6 animate-scale-in">
            <EvaluateResults result={result} />
          </div>
        }
      </main>
    </div>);

}