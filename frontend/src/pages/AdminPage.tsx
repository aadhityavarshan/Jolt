import { useState } from "react";
import { Link } from "react-router-dom";
import { uploadClinical, uploadPolicy, isMockMode, setMockMode } from "@/lib/api";
import UploadCard from "@/components/UploadCard";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft } from "lucide-react";

export default function AdminPage() {
  const [mock, setMock] = useState(isMockMode());

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
          onUpload={async (file) => {
            await uploadClinical("", file);
          }}
        />

        {/* Policy Upload */}
        <UploadCard
          title="Upload Policy Document"
          description="Upload payer policy documents."
          onUpload={async (file) => {
            await uploadPolicy("", [], file);
          }}
        />
      </main>
    </div>
  );
}
