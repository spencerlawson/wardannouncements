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

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Upload failed");
  }
  const { url } = await res.json();
  return url;
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
  const [headerImageUrl, setHeaderImageUrl] = useState(announcement.headerImageUrl ?? "");
  const [uploadingHeader, setUploadingHeader] = useState(false);
  const [keptAttachments, setKeptAttachments] = useState(existingAttachments);
  const [newAttachments, setNewAttachments] = useState<NewAttachment[]>([]);
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<string[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleHeaderImageUpload = async (file: File | null) => {
    if (!file) return;
    setUploadingHeader(true);
    try {
      const url = await uploadFile(file);
      setHeaderImageUrl(url);
    } catch (err) {
      toast.error((err as Error).message ?? "Upload failed");
    } finally {
      setUploadingHeader(false);
    }
  };

  const handleAttachmentUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingAttachment(true);
    try {
      const uploaded: NewAttachment[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadFile(file);
        uploaded.push({
          fileUrl: url,
          fileName: file.name,
          fileType: file.type.startsWith("image/") ? "image" : "document",
          fileSize: file.size,
        });
      }
      setNewAttachments((prev) => [...prev, ...uploaded]);
      toast.success(`${uploaded.length} file(s) uploaded`);
    } catch (err) {
      toast.error((err as Error).message ?? "Upload failed");
    } finally {
      setUploadingAttachment(false);
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
          headerImageUrl: headerImageUrl || undefined,
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

      {/* Header Image */}
      <div className="space-y-2">
        <Label>Header Image</Label>
        <p className="text-xs text-muted-foreground">Optional image displayed at the top of the announcement card</p>
        {headerImageUrl ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={headerImageUrl}
              alt="Header"
              className="w-full h-40 object-cover rounded-lg border"
            />
            <button
              type="button"
              onClick={() => setHeaderImageUrl("")}
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg h-28 cursor-pointer hover:bg-muted/40 transition-colors">
            {uploadingHeader ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <>
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Upload header image</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleHeaderImageUpload(e.target.files?.[0] ?? null)}
              disabled={uploadingHeader}
            />
          </label>
        )}
      </div>

      {/* Attachments */}
      <div className="space-y-2">
        <Label>Attachments</Label>
        <p className="text-xs text-muted-foreground">PDFs, Word documents, or additional images</p>
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
          {uploadingAttachment ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm text-muted-foreground">
            {uploadingAttachment ? "Uploading…" : "Add files"}
          </span>
          <input
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => handleAttachmentUpload(e.target.files)}
            disabled={uploadingAttachment}
          />
        </label>
      </div>

      <div className="flex gap-3 pt-2 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSave(false)}
          disabled={isPending || uploadingHeader || uploadingAttachment}
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
          Save as Draft
        </Button>
        <Button
          type="button"
          onClick={() => handleSave(true)}
          disabled={isPending || uploadingHeader || uploadingAttachment}
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
          Submit for Approval
        </Button>
      </div>
    </div>
  );
}
