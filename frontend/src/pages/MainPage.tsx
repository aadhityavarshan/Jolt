import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { evaluate, getAllPatients, getDocumentContent, getEvaluationRuns, getPatientProfile } from "@/lib/api";
import type { Laterality, Patient, PatientDocument, Procedure } from "@/lib/types";
import CPTSearch from "@/components/CptSearch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ArrowLeft, Clock3, FileText, Loader2, Search, UserRound } from "lucide-react";

export default function MainPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const [payerFilter, setPayerFilter] = useState<string>("all");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [procedure, setProcedure] = useState<Procedure | null>(null);
  const [laterality, setLaterality] = useState<Laterality>("both");
  const [selectedDoc, setSelectedDoc] = useState<PatientDocument | null>(null);

  const {
    data: patients = [],
    isLoading: isPatientsLoading,
    isError: isPatientsError,
  } = useQuery({
    queryKey: ["patients-all"],
    queryFn: getAllPatients,
  });

  const selectedPatient = useMemo(
    () => (selectedPatientId ? patients.find((patient) => patient.id === selectedPatientId) ?? null : null),
    [patients, selectedPatientId],
  );

  const {
    data: profile,
    isLoading: isProfileLoading,
    isError: isProfileError,
    error: profileError,
  } = useQuery({
    queryKey: ["patient-profile", selectedPatientId],
    queryFn: () => getPatientProfile(selectedPatientId as string),
    enabled: Boolean(selectedPatientId),
  });

  const {
    data: runs = [],
    isLoading: isRunsLoading,
    isError: isRunsError,
  } = useQuery({
    queryKey: ["evaluation-runs"],
    queryFn: getEvaluationRuns,
  });

  const evaluationPatient = useMemo<Patient | null>(() => {
    if (selectedPatient) return selectedPatient;
    if (!profile) return null;

    const payerFromCoverage = profile.coverage[0]?.payer ?? "Unknown";
    return {
      id: profile.patient.id,
      name: `${profile.patient.first_name} ${profile.patient.last_name}`.trim(),
      dob: profile.patient.dob,
      payer: payerFromCoverage,
    };
  }, [profile, selectedPatient]);

  const mostRecentRun = useMemo(() => {
    if (!selectedPatientId) return null;

    const patientRuns = runs.filter((run) => run.patientId === selectedPatientId);
    if (patientRuns.length === 0) return null;

    return patientRuns.sort((a, b) => {
      const aTime = new Date(a.requestedAt).getTime();
      const bTime = new Date(b.requestedAt).getTime();
      return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
    })[0];
  }, [runs, selectedPatientId]);

  const {
    data: docContent,
    isLoading: isDocLoading,
    isError: isDocError,
  } = useQuery({
    queryKey: ["document-content", selectedPatientId, selectedDoc?.filename],
    queryFn: () => getDocumentContent(selectedPatientId as string, selectedDoc!.filename),
    enabled: Boolean(selectedPatientId && selectedDoc),
  });

  const dedupedDocuments = useMemo(() => {
    if (!profile) return [];
    const seen = new Set<string>();

    return profile.documents.filter((document) => {
      if (seen.has(document.filename)) return false;
      seen.add(document.filename);
      return true;
    });
  }, [profile]);

  const evaluateMutation = useMutation({
    mutationFn: evaluate,
    onSuccess: (data) => {
      if (!evaluationPatient || !procedure) return;

      navigate("/results", {
        state: {
          result: data,
          patient: evaluationPatient,
          procedure,
          laterality,
        },
      });
    },
  });

  const payerOptions = useMemo(() => {
    const unique = new Set(patients.map((patient) => patient.payer).filter(Boolean));
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [patients]);

  // Build a map of patientId → most recent evaluation timestamp
  const lastEvalAt = useMemo(() => {
    const map = new Map<string, number>();
    for (const run of runs) {
      const t = new Date(run.requestedAt).getTime();
      if (!Number.isNaN(t)) {
        const existing = map.get(run.patientId);
        if (existing === undefined || t > existing) map.set(run.patientId, t);
      }
    }
    return map;
  }, [runs]);

  const filteredPatients = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return patients
      .filter((patient) => {
        const matchesSearch =
          normalizedSearch.length === 0 ||
          patient.name.toLowerCase().includes(normalizedSearch) ||
          patient.id.toLowerCase().includes(normalizedSearch) ||
          patient.dob.toLowerCase().includes(normalizedSearch);

        const matchesPayer = payerFilter === "all" || patient.payer === payerFilter;

        return matchesSearch && matchesPayer;
      })
      .sort((a, b) => {
        const aTime = lastEvalAt.get(a.id) ?? 0;
        const bTime = lastEvalAt.get(b.id) ?? 0;
        if (bTime !== aTime) return bTime - aTime;
        return a.name.localeCompare(b.name);
      });
  }, [patients, payerFilter, searchTerm, lastEvalAt]);

  const relativeTime = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days = Math.floor(diff / 86_400_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    return new Date(ts).toLocaleDateString();
  };

  const formatDate = (value: string | null | undefined) => {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
  };

  const formatDateTime = (value: string | null | undefined) => {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  };

  const recommendationLabel = (value: string | null) => {
    if (value === "LIKELY_APPROVED") return "Likely Approved";
    if (value === "LIKELY_DENIED") return "Likely Denied";
    if (value === "INSUFFICIENT_INFO") return "Insufficient Info";
    return "-";
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatientId(patient.id);
    setProcedure(null);
    setLaterality("both");
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
    });
  };

  const canEvaluate = Boolean(selectedPatientId && evaluationPatient && procedure);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card animate-fade-in">
        <div className="mx-auto max-w-[1100px] px-6 py-4 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <div>
              <h1 className="text-xl font-bold tracking-tight">Pre-Check Patients</h1>
              <p className="text-sm text-muted-foreground">Browse patient profiles before running prior authorization checks</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-6 py-6 space-y-6">
        {selectedPatientId && (
          <div>
            <Button
              size="default"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => setSelectedPatientId(null)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Patient List
            </Button>
          </div>
        )}

        {selectedPatientId ? (
          <>
            {selectedPatient && (
              <Card className="animate-fade-in-up stagger-1">
                <CardContent className="pt-6 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">Patient: {selectedPatient.name}</Badge>
                  <Badge variant="secondary">DOB: {formatDate(selectedPatient.dob)}</Badge>
                  <Badge variant="secondary">Payer: {selectedPatient.payer}</Badge>
                  <Badge variant="outline">Patient ID: {selectedPatient.id}</Badge>
                </CardContent>
              </Card>
            )}

            {isProfileLoading ? (
              <Card>
                <CardContent className="pt-6 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading patient profile...
                </CardContent>
              </Card>
            ) : isProfileError ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-destructive">
                    {profileError instanceof Error ? profileError.message : "Failed to load patient profile."}
                  </p>
                </CardContent>
              </Card>
            ) : profile ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up stagger-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <UserRound className="h-4 w-4 text-primary" />
                        Patient Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p><span className="text-muted-foreground">Name:</span> {profile.patient.first_name} {profile.patient.last_name}</p>
                      <p><span className="text-muted-foreground">DOB:</span> {formatDate(profile.patient.dob)}</p>
                      <p><span className="text-muted-foreground">MRN:</span> {profile.patient.mrn ?? "-"}</p>
                      <p><span className="text-muted-foreground">Profile ID:</span> {profile.patient.id}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-primary" />
                        Active Coverage
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {profile.coverage.length === 0 && (
                        <p className="text-sm text-muted-foreground">No active coverage records found.</p>
                      )}
                      {profile.coverage.map((coverage) => (
                        <div key={coverage.id} className="rounded-md border p-3 space-y-1">
                          <p className="text-sm font-medium">{coverage.payer}</p>
                          <p className="text-xs text-muted-foreground">Plan: {coverage.plan_name ?? "-"}</p>
                          <p className="text-xs text-muted-foreground">Member ID: {coverage.member_id ?? "-"}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up stagger-3 relative z-10 overflow-visible">
                  <CPTSearch
                    selected={procedure}
                    laterality={laterality}
                    onSelect={(selectedProcedure) => setProcedure(selectedProcedure)}
                    onLateralityChange={setLaterality}
                    onClearSelection={() => setProcedure(null)}
                  />

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base font-semibold">Run Evaluation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {procedure ? (
                        <>
                          <Badge variant="secondary">CPT: {procedure.cptCode}</Badge>
                          <p className="text-sm text-muted-foreground">{procedure.label}</p>
                          {procedure.hasLaterality && (
                            <Badge variant="secondary">Laterality: {laterality}</Badge>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">Select a procedure to evaluate this patient.</p>
                      )}

                      <Button
                        onClick={() => {
                          if (!selectedPatientId || !evaluationPatient || !procedure) return;
                          evaluateMutation.mutate({
                            patient_id: selectedPatientId,
                            cpt_code: procedure.cptCode,
                            payer: evaluationPatient.payer,
                          });
                        }}
                        disabled={!canEvaluate || evaluateMutation.isPending}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {evaluateMutation.isPending ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" /> Evaluating...
                          </span>
                        ) : (
                          "Evaluate"
                        )}
                      </Button>

                      {evaluateMutation.isError && (
                        <p className="text-sm text-destructive">Evaluation failed. Please try again.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card className="animate-fade-in-up stagger-4">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-primary" />
                      Most Recent Authorization Evaluation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {isRunsLoading && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading evaluations...
                      </div>
                    )}
                    {isRunsError && (
                      <p className="text-sm text-destructive">Failed to load evaluation history.</p>
                    )}
                    {!isRunsLoading && !isRunsError && !mostRecentRun && (
                      <p className="text-sm text-muted-foreground">No evaluations found for this patient yet.</p>
                    )}
                    {!isRunsLoading && !isRunsError && mostRecentRun && (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">Status: {mostRecentRun.status}</Badge>
                          <Badge variant="secondary">CPT: {mostRecentRun.cptCode}</Badge>
                          <Badge variant="secondary">Payer: {mostRecentRun.payer}</Badge>
                          <Badge variant="outline">Run ID: {mostRecentRun.determinationId}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Requested: {formatDateTime(mostRecentRun.requestedAt)}</p>
                        <p className="text-sm text-muted-foreground">Completed: {formatDateTime(mostRecentRun.completedAt)}</p>
                        <p className="text-sm text-muted-foreground">
                          Recommendation: {recommendationLabel(mostRecentRun.recommendation)}
                          {typeof mostRecentRun.probabilityScore === "number"
                            ? ` (${Math.round(mostRecentRun.probabilityScore * 100)}%)`
                            : ""}
                        </p>
                        <p className="text-sm text-muted-foreground">Missing info count: {mostRecentRun.missingInfoCount}</p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : null}

            {profile && (
              <>
                <Card className="animate-fade-in-up stagger-5">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Clinical Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {dedupedDocuments.length === 0 && (
                      <p className="text-sm text-muted-foreground">No clinical documents found.</p>
                    )}
                    {dedupedDocuments.map((document) => (
                      <button
                        key={`${document.filename}-${document.date ?? "none"}`}
                        type="button"
                        onClick={() => setSelectedDoc(document)}
                        className="w-full text-left rounded-md border px-3 py-2 hover:bg-muted transition-colors cursor-pointer"
                      >
                        <p className="text-sm font-medium break-all">{document.filename}</p>
                        <p className="text-xs text-muted-foreground">
                          Type: {document.record_type} | Date: {formatDate(document.date)}
                        </p>
                      </button>
                    ))}
                  </CardContent>
                </Card>

                <Sheet open={Boolean(selectedDoc)} onOpenChange={(open) => { if (!open) setSelectedDoc(null); }}>
                  <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
                    <SheetHeader className="mb-4">
                      <SheetTitle className="break-all">{selectedDoc?.filename}</SheetTitle>
                      <SheetDescription>
                        {selectedDoc?.record_type} &mdash; {formatDate(selectedDoc?.date ?? null)}
                      </SheetDescription>
                    </SheetHeader>
                    {isDocLoading && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading document...
                      </div>
                    )}
                    {isDocError && (
                      <p className="text-sm text-destructive">Failed to load document content.</p>
                    )}
                    {!isDocLoading && !isDocError && docContent && (
                      <pre className="text-sm whitespace-pre-wrap break-words font-sans leading-relaxed">
                        {docContent.content}
                      </pre>
                    )}
                  </SheetContent>
                </Sheet>
              </>
            )}
          </>
        ) : (
          <Card className="animate-fade-in-up stagger-1">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-primary" />
                All Patients
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                <div className="relative lg:col-span-3" ref={searchDropdownRef}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(event) => {
                      setSearchTerm(event.target.value);
                      setSearchDropdownOpen(true);
                    }}
                    onFocus={() => setSearchDropdownOpen(true)}
                    onBlur={(e) => {
                      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.relatedTarget as Node)) {
                        setSearchDropdownOpen(false);
                      }
                    }}
                    placeholder="Type to search patients..."
                    className="pl-9"
                  />
                  {searchDropdownOpen && filteredPatients.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-64 overflow-auto">
                      {filteredPatients.slice(0, 20).map((patient) => (
                        <button
                          key={patient.id}
                          className="w-full text-left px-3 py-2.5 hover:bg-accent transition-colors first:rounded-t-md last:rounded-b-md"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            handleSelectPatient(patient);
                            setSearchTerm("");
                            setSearchDropdownOpen(false);
                          }}
                        >
                          <span className="text-sm font-medium">{patient.name}</span>
                          <span className="ml-2 text-xs text-muted-foreground">DOB: {patient.dob}</span>
                          <span className="ml-2 text-xs text-muted-foreground">• {patient.payer}</span>
                        </button>
                      ))}
                      {filteredPatients.length > 20 && (
                        <div className="px-3 py-2 text-xs text-muted-foreground border-t">
                          {filteredPatients.length - 20} more — keep typing to narrow results
                        </div>
                      )}
                    </div>
                  )}
                  {searchDropdownOpen && searchTerm.length > 0 && filteredPatients.length === 0 && !isPatientsLoading && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg px-3 py-2.5 text-sm text-muted-foreground">
                      No patients found.
                    </div>
                  )}
                </div>

                <Select value={payerFilter} onValueChange={setPayerFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by payer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payers</SelectItem>
                    {payerOptions.map((payer) => (
                      <SelectItem key={payer} value={payer}>{payer}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredPatients.length} of {patients.length} patients
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setPayerFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>

              {isPatientsLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading patients...
                </div>
              )}

              {isPatientsError && (
                <p className="text-sm text-destructive">Failed to load patient list.</p>
              )}

              {!isPatientsLoading && !isPatientsError && patients.length === 0 && (
                <p className="text-sm text-muted-foreground">No patients found yet.</p>
              )}

              {!isPatientsLoading && !isPatientsError && patients.length > 0 && filteredPatients.length === 0 && (
                <p className="text-sm text-muted-foreground">No patients match the current filters.</p>
              )}

              {!isPatientsLoading && !isPatientsError && filteredPatients.map((patient) => (
                <Card
                  key={patient.id}
                  className="border-muted cursor-pointer transition-colors hover:bg-accent/40"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectPatient(patient)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleSelectPatient(patient);
                    }
                  }}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold">{patient.name}</p>
                      {lastEvalAt.has(patient.id) ? (
                        <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                          <Clock3 className="h-3 w-3" /> {relativeTime(lastEvalAt.get(patient.id)!)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50 shrink-0">No evaluations</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">Payer: {patient.payer}</Badge>
                      <Badge variant="secondary">DOB: {formatDate(patient.dob)}</Badge>
                      <Badge variant="outline">ID: {patient.id}</Badge>
                    </div>
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
