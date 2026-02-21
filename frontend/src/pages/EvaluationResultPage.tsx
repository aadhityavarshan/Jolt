import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { getEvaluationById, getEvaluationRuns, searchPatients } from "@/lib/api";
import type { EvaluationResult, EvaluationRun, Laterality, Patient, Procedure } from "@/lib/types";
import EvaluateResults from "@/components/EvaluateResults";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Clock3, FileCheck2, Loader2, Search, X } from "lucide-react";

type EvaluationResultLocationState = {
  result: EvaluationResult;
  patient: Patient;
  procedure: Procedure;
  laterality: Laterality;
};

export default function EvaluationResultPage() {
  const { state } = useLocation();
  const evaluationState = state as EvaluationResultLocationState | undefined;
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [recommendationFilter, setRecommendationFilter] = useState<string>("all");
  const [patientQuery, setPatientQuery] = useState("");
  const [patientLookupOpen, setPatientLookupOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(evaluationState?.result?.determinationId ?? null);
  const patientLookupRef = useRef<HTMLDivElement>(null);
  const historyScrollYRef = useRef(0);

  const { data: runs = [], isLoading, isError } = useQuery({
    queryKey: ["evaluation-runs"],
    queryFn: getEvaluationRuns,
  });

  const { data: patientOptions = [], isFetching: isPatientFetching } = useQuery({
    queryKey: ["results-patient-lookup", patientQuery],
    queryFn: () => searchPatients(patientQuery),
    enabled: patientQuery.length >= 2,
  });

  const selectedRun = useMemo(
    () => (selectedRunId ? runs.find((run) => run.determinationId === selectedRunId) ?? null : null),
    [runs, selectedRunId],
  );

  const {
    data: selectedRunResult,
    isLoading: isSelectedRunLoading,
    isError: isSelectedRunError,
    error: selectedRunError,
  } = useQuery({
    queryKey: ["evaluation-run-detail", selectedRunId],
    queryFn: () => getEvaluationById(selectedRunId as string),
    enabled: Boolean(selectedRunId && selectedRun?.status === "complete"),
  });

  const result = evaluationState?.result;
  const patient = evaluationState?.patient;
  const procedure = evaluationState?.procedure;
  const laterality = evaluationState?.laterality;

  const formatDateTime = (value: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
  };

  const recommendationLabel = (run: EvaluationRun) => {
    if (run.recommendation === "LIKELY_APPROVED") return "Likely Approved";
    if (run.recommendation === "LIKELY_DENIED") return "Likely Denied";
    if (run.recommendation === "INSUFFICIENT_INFO") return "Insufficient Info";
    return "—";
  };

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (patientLookupRef.current && !patientLookupRef.current.contains(event.target as Node)) {
        setPatientLookupOpen(false);
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const filteredRuns = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return runs.filter((run) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        run.determinationId.toLowerCase().includes(normalizedSearch) ||
        run.patientName.toLowerCase().includes(normalizedSearch) ||
        run.cptCode.toLowerCase().includes(normalizedSearch) ||
        run.payer.toLowerCase().includes(normalizedSearch);

      const matchesStatus = statusFilter === "all" || run.status === statusFilter;
      const matchesRecommendation = recommendationFilter === "all" || run.recommendation === recommendationFilter;
      const matchesPatient = !selectedPatient || run.patientId === selectedPatient.id;

      return matchesSearch && matchesStatus && matchesRecommendation && matchesPatient;
    });
  }, [runs, searchTerm, statusFilter, recommendationFilter, selectedPatient]);

  const handleSelectRun = (runId: string) => {
    historyScrollYRef.current = window.scrollY;
    setSelectedRunId(runId);
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
    });
  };

  const handleBackToHistory = () => {
    setSelectedRunId(null);
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: historyScrollYRef.current, behavior: "auto" });
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-[1100px] px-6 py-4 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <div>
              <h1 className="text-xl font-bold tracking-tight">Evaluation Result</h1>
              <p className="text-sm text-muted-foreground">Prior Authorization Decision Support</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-6 py-6 space-y-6">
        {selectedRunId && (
          <div>
            <Button
              size="default"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleBackToHistory}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Evaluation History
            </Button>
          </div>
        )}

        {selectedRun ? (
          <>
            <Card>
              <CardContent className="pt-6 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">Patient: {selectedRun.patientName}</Badge>
                <Badge variant="secondary">Payer: {selectedRun.payer}</Badge>
                <Badge variant="secondary">CPT: {selectedRun.cptCode}</Badge>
                <Badge variant="outline">Status: {selectedRun.status}</Badge>
                <Badge variant="outline">Run ID: {selectedRun.determinationId}</Badge>
              </CardContent>
            </Card>

            {selectedRun.status !== "complete" ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">
                    This run is currently {selectedRun.status}. Full evaluation sections are shown once the run is complete.
                  </p>
                </CardContent>
              </Card>
            ) : isSelectedRunLoading ? (
              <Card>
                <CardContent className="pt-6 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading selected run details...
                </CardContent>
              </Card>
            ) : isSelectedRunError ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-destructive">
                    {selectedRunError instanceof Error
                      ? selectedRunError.message
                      : "Failed to load selected run details."}
                  </p>
                </CardContent>
              </Card>
            ) : selectedRunResult ? (
              <EvaluateResults result={selectedRunResult} />
            ) : null}
          </>
        ) : result && patient && procedure ? (
          <>
            <Card>
              <CardContent className="pt-6 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">Patient: {patient.name}</Badge>
                <Badge variant="secondary">Payer: {patient.payer}</Badge>
                <Badge variant="secondary">Procedure: {procedure.label}</Badge>
                <Badge variant="secondary">CPT: {procedure.cptCode}</Badge>
                {procedure.hasLaterality && laterality && (
                  <Badge variant="secondary">Laterality: {laterality}</Badge>
                )}
              </CardContent>
            </Card>

            <EvaluateResults result={result} />
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-primary" />
                Evaluation History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Select and run an evaluation from the main page to view full details, and see all past runs below.
              </p>
            </CardContent>
          </Card>
        )}

        {!selectedRunId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-primary" />
              All Evaluation Runs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by ID, patient, CPT, or payer..."
                  className="pl-9"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>

              <Select value={recommendationFilter} onValueChange={setRecommendationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by recommendation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Recommendations</SelectItem>
                  <SelectItem value="LIKELY_APPROVED">Likely Approved</SelectItem>
                  <SelectItem value="LIKELY_DENIED">Likely Denied</SelectItem>
                  <SelectItem value="INSUFFICIENT_INFO">Insufficient Info</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2" ref={patientLookupRef}>
              <p className="text-xs text-muted-foreground">Patient Lookup</p>
              {selectedPatient ? (
                <div className="flex items-center justify-between rounded-md border bg-card px-3 py-2">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{selectedPatient.name}</p>
                    <p className="text-xs text-muted-foreground">DOB: {selectedPatient.dob} • {selectedPatient.payer}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setSelectedPatient(null);
                      setPatientQuery("");
                      setPatientLookupOpen(false);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={patientQuery}
                    onChange={(e) => {
                      setPatientQuery(e.target.value);
                      setPatientLookupOpen(true);
                    }}
                    onFocus={() => patientQuery.length >= 2 && setPatientLookupOpen(true)}
                    placeholder="Find a patient to filter runs..."
                    className="pl-9"
                  />
                  {patientLookupOpen && patientQuery.length >= 2 && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-52 overflow-auto">
                      {isPatientFetching && (
                        <div className="px-3 py-2 text-sm text-muted-foreground">Searching patients...</div>
                      )}
                      {!isPatientFetching && patientOptions.length === 0 && (
                        <div className="px-3 py-2 text-sm text-muted-foreground">No patients found.</div>
                      )}
                      {!isPatientFetching && patientOptions.map((p) => (
                        <button
                          key={p.id}
                          className="w-full text-left px-3 py-2 hover:bg-accent transition-colors"
                          onClick={() => {
                            setSelectedPatient(p);
                            setPatientQuery("");
                            setPatientLookupOpen(false);
                          }}
                        >
                          <span className="text-sm font-medium">{p.name}</span>
                          <span className="ml-2 text-xs text-muted-foreground">DOB: {p.dob}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredRuns.length} of {runs.length} runs
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setRecommendationFilter("all");
                  setSelectedPatient(null);
                  setPatientQuery("");
                  setPatientLookupOpen(false);
                }}
              >
                Clear Filters
              </Button>
            </div>

            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading runs...
              </div>
            )}

            {isError && (
              <p className="text-sm text-destructive">Failed to load evaluation runs.</p>
            )}

            {!isLoading && !isError && runs.length === 0 && (
              <p className="text-sm text-muted-foreground">No evaluation runs found yet.</p>
            )}

            {!isLoading && !isError && runs.length > 0 && filteredRuns.length === 0 && (
              <p className="text-sm text-muted-foreground">No runs match the current filters.</p>
            )}

            {!isLoading && !isError && filteredRuns.map((run) => (
              <Card
                key={run.determinationId}
                className={`border-muted cursor-pointer transition-colors ${selectedRunId === run.determinationId ? "ring-1 ring-primary" : "hover:bg-accent/40"}`}
                role="button"
                tabIndex={0}
                onClick={() => handleSelectRun(run.determinationId)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleSelectRun(run.determinationId);
                  }
                }}
              >
                <CardContent className="pt-4">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant="outline">ID: {run.determinationId}</Badge>
                    <Badge variant="secondary">Status: {run.status}</Badge>
                    <Badge variant="secondary">Patient: {run.patientName}</Badge>
                    <Badge variant="secondary">CPT: {run.cptCode}</Badge>
                    <Badge variant="secondary">Payer: {run.payer}</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                    <p>Requested: {formatDateTime(run.requestedAt)}</p>
                    <p>Completed: {formatDateTime(run.completedAt)}</p>
                    <p>
                      Recommendation: {recommendationLabel(run)}
                      {typeof run.probabilityScore === "number" ? ` (${Math.round(run.probabilityScore * 100)}%)` : ""}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Missing info count: {run.missingInfoCount}</p>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
        )}
      </main>
    </div>
  );
}
