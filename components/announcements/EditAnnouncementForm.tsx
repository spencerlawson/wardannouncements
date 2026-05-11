"use client";

import { useState, useTransition } from "react";
import { TipTapEditor } from "@/components/editor/TipTap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateAnnouncement } from "@/lib/actions/announcements";
import { toast } from "sonner";
import { Loader2, Upload, X, FileText, ImageIcon } from "lucide-react";
import type { Announcement, AnnouncementAttachment } from "@/lib/db/schema";

interface NewAttachment {
  fileUrl: string;
  fileName: string;
  fileType: "image" | "document";
  fileSize: number;
}

export default function EditAnnouncementForm({
  announcement,
  org,
  existingAttachments,
}: {
  announcement: Announcement;
  org: { id: string; name: string };
  existingAttachments: AnnouncementAttachment[];
}) {
  const [title, setTitle] = useState(announcement.title);
  const [body, setBody] = useState(announcement.body);
  const [displayStartDate, setDisplayStartDate] = useState(announcement.displayStartDate);
  const [displayEndDate, setDisplayEndDate] = useState(announcement.displayEndDate);
  const [keptAttachments, setKeptAttachments] = useState(existingAttachments);
  const [newAttachments, setNewAttachments] = useState<NewAttachment[]>([]);
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: NewAttachment[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Upload failed");
        const { url } = await res.json();
        uploaded.push({
          fileUrl: url,
          fileName: file.name,
          fileType: file.type.startsWith("image/") ? "image" : "document",
          fileSize: file.size,
        });
      }
      setNewAttachments((prev) => [...prev, ...uploaded]);
      toast.success(`${uploaded.length} file(s) uploaded`);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeExisting = (id: string) => {
    setKeptAttachments((prev) => prev.filter((a) => a.id !== id));
    setRemovedAttachmentIds((prev) => [...prev, id]);
  };

  const handleSave = (submit: boolean) => {
    if (!title.trim()) return toast.error("Title is required");
    startTransition(async () => {
      try {
        await updateAnnouncement({
          announcementId: announcement.id,
          title: title.trim(),
          body,
          displayStartDate,
          displayEndDate,
          newAttachments,
          removedAttachmentIds,
          submit,
        });
      } catch (error) {
        toast.error((error as Error).message ?? "Failed to save");
      }
    });
  };

  return (
    <div className="space-y-6 bg-white border rounded-xl p-6">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title *</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label>Body</Label>
        <TipTapEditor content={body} onChange={setBody} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Display Start *</Label>
          <Input
            type="date"
            value={displayStartDate}
            onChange={(e) => setDisplayStartDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Display End *</Label>
          <Input
            type="date"
            value={displayEndDate}
            onChange={(e) => setDisplayEndDate(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Attachments</Label>
        <div className="space-y-1.5">
          {keptAttachments.map((att) => (
            <div key={att.id} className="flex items-center justify-between text-sm p-2.5 bg-muted rounded-lg">
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
                onClick={() => removeExisting(att.id)}
                className="ml-2 text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {newAttachments.map((att, i) => (
            <div key={i} className="flex items-center justify-between text-sm p-2.5 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 min-w-0">
                {att.fileType === "image" ? (
                  <ImageIcon className="h-4 w-4 text-green-600 shrink-0" />
                ) : (
                  <FileText className="h-4 w-4 text-green-600 shrink-0" />
                )}
                <span className="truncate">{att.fileName}</span>
              </div>
              <button
                type="button"
                onClick={() => setNewAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                className="ml-2 text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <label className="flex items-center gap-3 border-2 border-dashed rounded-lg p-3 cursor-pointer hover:bg-muted/40 transition-colors">
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm text-muted-foreground">
            {uploading ? "Uploading…" : "Add more files"}
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
      </div>

      <div className="flex gap-3 pt-2 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSave(false)}
          disabled={isPending || uploading}
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
          Save as Draft
        </Button>
        <Button
          type="button"
          onClick={() => handleSave(true)}
          disabled={isPending || uploading}
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
          Submit for Approval
        </Button>
      </div>
    </div>
  );
}
