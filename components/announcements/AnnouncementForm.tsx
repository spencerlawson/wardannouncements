"use client";

import { useState, useTransition } from "react";
import { TipTapEditor } from "@/components/editor/TipTap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAnnouncement } from "@/lib/actions/announcements";
import { toast } from "sonner";
import { Loader2, Upload, X, FileText, ImageIcon } from "lucide-react";

interface Org {
  id: string;
  name: string;
}

interface Attachment {
  fileUrl: string;
  fileName: string;
  fileType: "image" | "document";
  fileSize: number;
}

export default function AnnouncementForm({ orgs }: { orgs: Org[] }) {
  const [selectedOrgId, setSelectedOrgId] = useState(orgs[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [displayStartDate, setDisplayStartDate] = useState("");
  const [displayEndDate, setDisplayEndDate] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: Attachment[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Upload failed");
        }
        const { url } = await res.json();
        uploaded.push({
          fileUrl: url,
          fileName: file.name,
          fileType: file.type.startsWith("image/") ? "image" : "document",
          fileSize: file.size,
        });
      }
      setAttachments((prev) => [...prev, ...uploaded]);
      toast.success(`${uploaded.length} file(s) uploaded`);
    } catch (err) {
      toast.error((err as Error).message ?? "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (submit: boolean) => {
    if (!title.trim()) return toast.error("Title is required");
    if (!displayStartDate) return toast.error("Display start date is required");
    if (!displayEndDate) return toast.error("Display end date is required");
    if (displayEndDate < displayStartDate) return toast.error("End date must be after start date");

    startTransition(async () => {
      try {
        await createAnnouncement({
          organizationId: selectedOrgId,
          title: title.trim(),
          body,
          displayStartDate,
          displayEndDate,
          attachments,
          submit,
        });
      } catch (error) {
        toast.error((error as Error).message ?? "Failed to save");
      }
    });
  };

  return (
    <div className="space-y-6 bg-white border rounded-xl p-6">
      {orgs.length > 1 && (
        <div className="space-y-1.5">
          <Label>Ward</Label>
          <Select value={selectedOrgId} onValueChange={(v) => v && setSelectedOrgId(v)}>
            <SelectTrigger>
              {orgs.find((o) => o.id === selectedOrgId)?.name ?? "Select ward"}
            </SelectTrigger>
            <SelectContent>
              {orgs.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Announcement title"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Body</Label>
        <TipTapEditor content={body} onChange={setBody} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="startDate">Display Start *</Label>
          <Input
            id="startDate"
            type="date"
            value={displayStartDate}
            onChange={(e) => setDisplayStartDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endDate">Display End *</Label>
          <Input
            id="endDate"
            type="date"
            value={displayEndDate}
            onChange={(e) => setDisplayEndDate(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Attachments</Label>
        <label className="flex items-center gap-3 border-2 border-dashed rounded-lg p-4 cursor-pointer hover:bg-muted/40 transition-colors">
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm text-muted-foreground">
            {uploading ? "Uploading…" : "Upload images or documents (PDF, Word)"}
          </span>
          <input
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
            disabled={uploading}
          />
        </label>

        {attachments.length > 0 && (
          <div className="space-y-1.5">
            {attachments.map((att, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm p-2.5 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {att.fileType === "image" ? (
                    <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="truncate">{att.fileName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                  className="ml-2 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSubmit(false)}
          disabled={isPending || uploading}
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
          Save as Draft
        </Button>
        <Button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={isPending || uploading}
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
          Submit for Approval
        </Button>
      </div>
    </div>
  );
}
