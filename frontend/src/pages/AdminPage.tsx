import { uploadClinical, uploadPolicy } from "@/lib/api";
import UploadCard from "@/components/UploadCard";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card animate-fade-in">
        <div className="mx-auto max-w-[1100px] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <div>
              <h1 className="text-xl font-bold tracking-tight">Admin Uploads</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Upload clinical and policy documents for demo data.</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-6 py-6 space-y-6">
        {/* Clinical Upload */}
        <div className="animate-fade-in-up stagger-1">
        <UploadCard
          title="Upload Clinical Document"
          description="Upload clinical records (lab reports, notes, imaging). Patient and metadata will be extracted automatically."
          onUpload={async (file) => {
            await uploadClinical(file);
          }}
        />
        </div>

        {/* Policy Upload */}
        <div className="animate-fade-in-up stagger-2">
        <UploadCard
          title="Upload Policy Document"
          description="Upload payer policy documents. Payer, CPT codes, and policy ID will be extracted automatically."
          onUpload={async (file) => {
            await uploadPolicy(file);
          }}
        />
        </div>
      </main>
    </div>
  );
}
