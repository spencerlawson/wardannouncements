"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { approveAnnouncement, requestRevision, submitAnnouncement } from "@/lib/actions/announcements";
import { toast } from "sonner";
import { Loader2, CheckCircle, RotateCcw, Send } from "lucide-react";
import type { AnnouncementStatus } from "@/lib/db/schema";

interface AnnouncementActionsProps {
  announcementId: string;
  status: AnnouncementStatus;
  isOwner: boolean;
  isLeader: boolean;
}

export default function AnnouncementActions({
  announcementId,
  status,
  isOwner,
  isLeader,
}: AnnouncementActionsProps) {
  const [revisionNotes, setRevisionNotes] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleApprove = () => {
    startTransition(async () => {
      try {
        await approveAnnouncement(announcementId);
        toast.success("Announcement approved");
      } catch (error) {
        toast.error((error as Error).message ?? "Failed to approve");
      }
    });
  };

  const handleRequestRevision = () => {
    if (!revisionNotes.trim()) {
      toast.error("Please add notes describing what needs to change");
      return;
    }
    startTransition(async () => {
      try {
        await requestRevision(announcementId, revisionNotes.trim());
        toast.success("Revision request sent");
        setDialogOpen(false);
        setRevisionNotes("");
      } catch (error) {
        toast.error((error as Error).message ?? "Failed to send revision request");
      }
    });
  };

  const handleSubmit = () => {
    startTransition(async () => {
      try {
        await submitAnnouncement(announcementId);
        toast.success("Submitted for approval");
      } catch (error) {
        toast.error((error as Error).message ?? "Failed to submit");
      }
    });
  };

  const showOwnerSubmit =
    isOwner && (status === "draft" || status === "revision_requested");
  const showLeaderActions = isLeader && status === "submitted";

  if (!showOwnerSubmit && !showLeaderActions) return null;

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-muted/40 rounded-lg border">
      {showOwnerSubmit && (
        <Button size="sm" onClick={handleSubmit} disabled={isPending} className="gap-1.5">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Submit for Approval
        </Button>
      )}

      {showLeaderActions && (
        <>
          <Button
            size="sm"
            onClick={handleApprove}
            disabled={isPending}
            className="gap-1.5 bg-green-600 hover:bg-green-700"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Approve
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={isPending}
            onClick={() => setDialogOpen(true)}
          >
            <RotateCcw className="h-4 w-4" />
            Request Revision
          </Button>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Revision</DialogTitle>
                <DialogDescription>
                  Describe what needs to be changed. The announcement creator will receive
                  these notes by email.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-1.5 py-2">
                <Label htmlFor="notes">Notes for the creator</Label>
                <Textarea
                  id="notes"
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder="What needs to be changed or added before this can be approved?"
                  rows={4}
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button onClick={handleRequestRevision} disabled={isPending}>
                  {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                  Send Revision Request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
