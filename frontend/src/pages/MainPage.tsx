import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import type { Patient, Procedure, Laterality } from "@/lib/types";
import { evaluate, isMockMode, setMockMode } from "@/lib/api";
import PatientSearch from "@/components/PatientSearch";
import CPTSearch from "@/components/CptSearch";
import AnatomyHighlighter from "@/components/AnatomyHighlighter";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function MainPage() {
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [procedure, setProcedure] = useState<Procedure | null>(null);
  const [laterality, setLaterality] = useState<Laterality>("both");
  const [mock, setMock] = useState(isMockMode());

  const mutation = useMutation({
    mutationFn: evaluate,
    onSuccess: (data) => {
      if (!patient || !procedure) return;
      navigate("/results", {
        state: {
          result: data,
          patient,
          procedure,
          laterality,
        },
      });
    }
  });

  const canEvaluate = patient !== null && procedure !== null;

  const handleEvaluate = () => {
    if (!canEvaluate) return;
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
        <div className="mx-auto max-w-[1100px] px-6 py-4 flex items-center">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <div>
              <p className="text-sm text-muted-foreground">Prior Authorization Pre-Check</p>
            </div>
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
              onSelect={(p) => {setPatient(p);}}
              onClear={() => {setPatient(null);}} />
            </div>

            <div className="animate-fade-in-up stagger-2 relative z-20">
            <CPTSearch
              selected={procedure}
              laterality={laterality}
              onSelect={(p) => {setProcedure(p);}}
              onLateralityChange={setLaterality}
              onClearSelection={() => { setProcedure(null); }} />
            </div>

            <Button
              onClick={handleEvaluate}
              disabled={!canEvaluate || mutation.isPending}
              className="w-full h-11 animate-fade-in-up stagger-3 relative z-0 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]"
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
      </main>
    </div>);

}