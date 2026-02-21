import { useState } from "react";
import { Link } from "react-router-dom";
import { uploadClinical, uploadPolicy, isMockMode, setMockMode } from "@/lib/api";
import UploadCard from "@/components/UploadCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft } from "lucide-react";

export default function AdminPage() {
  const [mock, setMock] = useState(isMockMode());
  const [patientId, setPatientId] = useState("");
  const [recordType, setRecordType] = useState("");
  const [documentDate, setDocumentDate] = useState("");
  const [payer, setPayer] = useState("");
  const [cptCodes, setCptCodes] = useState("");
  const [policyId, setPolicyId] = useState("");

  const toggleMock = (v: boolean) => {
    setMock(v);
    setMockMode(v);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-[1100px] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Admin Uploads</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Upload clinical and policy documents for demo data.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="mock-admin" className="text-xs text-muted-foreground">
              {mock ? "Mock Mode" : "Live Mode"}
            </Label>
            <Switch id="mock-admin" checked={mock} onCheckedChange={toggleMock} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-6 py-6 space-y-6">
        {/* Clinical Upload */}
        <UploadCard
          title="Upload Clinical Document"
          description="Upload clinical records (lab reports, notes, imaging)."
          fields={
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="patient_id">Patient ID</Label>
                <Input
                  id="patient_id"
                  placeholder="UUID from patients table"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="record_type">Record Type</Label>
                <Input
                  id="record_type"
                  placeholder="e.g. Progress Note"
                  value={recordType}
                  onChange={(e) => setRecordType(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="document_date">Document Date</Label>
                <Input
                  id="document_date"
                  type="date"
                  value={documentDate}
                  onChange={(e) => setDocumentDate(e.target.value)}
                />
              </div>
            </div>
          }
          onUpload={async (file) => {
            await uploadClinical(patientId, recordType, documentDate, file);
          }}
        />

        {/* Policy Upload */}
        <UploadCard
          title="Upload Policy Document"
          description="Upload payer policy documents."
          fields={
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="payer">Payer</Label>
                <Input
                  id="payer"
                  placeholder="e.g. Aetna"
                  value={payer}
                  onChange={(e) => setPayer(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="cpt_codes">CPT Codes</Label>
                <Input
                  id="cpt_codes"
                  placeholder="Comma-separated (e.g. 27447,27130)"
                  value={cptCodes}
                  onChange={(e) => setCptCodes(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="policy_id">Policy ID</Label>
                <Input
                  id="policy_id"
                  placeholder="e.g. CPB-0852"
                  value={policyId}
                  onChange={(e) => setPolicyId(e.target.value)}
                />
              </div>
            </div>
          }
          onUpload={async (file) => {
            const parsedCptCodes = cptCodes
              .split(",")
              .map((code) => code.trim())
              .filter(Boolean);
            await uploadPolicy(payer, parsedCptCodes, policyId, file);
          }}
        />
      </main>
    </div>
  );
}
