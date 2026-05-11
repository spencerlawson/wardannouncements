"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { addUsersFromCSV } from "@/lib/actions/users";
import { toast } from "sonner";
import { Loader2, Download, Upload, CheckCircle, AlertCircle } from "lucide-react";

const CSV_TEMPLATE = `email,name,role
john.smith@example.com,John Smith,announcement_poster
jane.doe@example.com,Jane Doe,ward_leader
`;

const ROLE_NOTE = "Role must be 'announcement_poster' or 'ward_leader'";

export default function CSVUploadForm({ organizationId }: { organizationId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<{
    added: number;
    updated: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ward-users-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = () => {
    if (!file) return toast.error("Select a CSV file first");
    startTransition(async () => {
      try {
        const text = await file.text();
        const res = await addUsersFromCSV({ organizationId, csvText: text });
        setResults(res);
        setFile(null);
        if (res.added > 0 || res.updated > 0) {
          toast.success(`${res.added} added, ${res.updated} updated`);
        } else {
          toast.info("No changes made");
        }
      } catch (error) {
        toast.error((error as Error).message ?? "Upload failed");
      }
    });
  };

  return (
    <div className="space-y-4 bg-white border rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Upload a CSV with columns: <code className="text-xs bg-muted px-1 py-0.5 rounded">email</code>,{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">name</code>,{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">role</code>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{ROLE_NOTE}</p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-1.5 shrink-0">
          <Download className="h-4 w-4" />
          Template
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex-1 flex items-center gap-2 border-2 border-dashed rounded-lg px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors">
          <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground truncate">
            {file ? file.name : "Choose CSV file…"}
          </span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResults(null); }}
          />
        </label>
        <Button onClick={handleUpload} disabled={!file || isPending} className="gap-1.5 shrink-0">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload
        </Button>
      </div>

      {results && (
        <div className="space-y-2 text-sm">
          <div className="flex gap-4 text-muted-foreground">
            <span className="text-green-600 font-medium">{results.added} added</span>
            <span className="text-blue-600 font-medium">{results.updated} updated</span>
            <span>{results.skipped} skipped</span>
          </div>
          {results.errors.length > 0 && (
            <div className="space-y-1">
              {results.errors.map((err, i) => (
                <div key={i} className="flex items-start gap-1.5 text-destructive text-xs">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  {err}
                </div>
              ))}
            </div>
          )}
          {results.errors.length === 0 && (results.added > 0 || results.updated > 0) && (
            <div className="flex items-center gap-1.5 text-green-600 text-xs">
              <CheckCircle className="h-3.5 w-3.5" />
              Upload complete
            </div>
          )}
        </div>
      )}
    </div>
  );
}
