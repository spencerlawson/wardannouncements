"use client";

import { useTransition } from "react";
import { Pin, PinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { togglePin } from "@/lib/actions/announcements";
import { toast } from "sonner";

export default function PinButton({
  announcementId,
  isPinned,
}: {
  announcementId: string;
  isPinned: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      try {
        await togglePin(announcementId, !isPinned);
        toast.success(isPinned ? "Announcement unpinned" : "Announcement pinned to top");
      } catch {
        toast.error("Failed to update pin status");
      }
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={isPending}
      className={isPinned ? "border-amber-400 text-amber-700 hover:bg-amber-50" : ""}
    >
      {isPinned ? (
        <>
          <PinOff className="h-3.5 w-3.5 mr-1.5" />
          Unpin
        </>
      ) : (
        <>
          <Pin className="h-3.5 w-3.5 mr-1.5" />
          Pin to top
        </>
      )}
    </Button>
  );
}
