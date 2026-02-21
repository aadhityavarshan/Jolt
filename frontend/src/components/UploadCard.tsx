import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";
import FileDropzone from "@/components/FileDropzone";

interface Props {
  title: string;
  description: string;
  fields: React.ReactNode;
  onUpload: (file: File) => Promise<void>;
}

export default function UploadCard({ title, description, fields, onUpload }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [progress, setProgress] = useState(0);

  const handleSubmit = async () => {
    if (!file) return;
    setStatus("uploading");
    setErrorMsg("");
    setProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 12, 90));
    }, 200);

    try {
      await onUpload(file);
      clearInterval(interval);
      setProgress(100);
      setStatus("success");
      setFile(null);
    } catch (e: unknown) {
      clearInterval(interval);
      setProgress(0);
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Upload failed");
    }
  };

  const isUploading = status === "uploading";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Upload className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields}

        <FileDropzone
          file={file}
          onFileChange={(f) => { setFile(f); setStatus("idle"); }}
          disabled={isUploading}
        />

        {isUploading && (
          <Progress value={progress} className="h-2" />
        )}

        <Button onClick={handleSubmit} disabled={!file || isUploading} className="w-full">
          {isUploading ? "Uploading..." : "Upload"}
        </Button>

        {status === "success" && (
          <p className="text-sm text-green-600 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" /> Uploaded successfully.
          </p>
        )}
        {status === "error" && (
          <p className="text-sm text-destructive flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4" /> {errorMsg}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
