"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteAnnouncement } from "@/lib/actions/announcements";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

export default function DeleteAnnouncementButton({
  announcementId,
  iconOnly = false,
}: {
  announcementId: string;
  iconOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteAnnouncement(announcementId);
      } catch (error) {
        toast.error((error as Error).message ?? "Failed to delete");
        setOpen(false);
      }
    });
  };

  return (
    <>
      {iconOnly ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-red-50"
          onClick={() => setOpen(true)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-destructive hover:bg-red-50 hover:border-red-200"
          onClick={() => setOpen(true)}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete announcement?</DialogTitle>
            <DialogDescription>
              This will permanently delete the announcement and all its attachments. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
              className="gap-1.5"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
