"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleSuperAdmin } from "@/lib/actions/users";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function ToggleSuperAdminButton({
  userId,
  currentValue,
}: {
  userId: string;
  currentValue: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    const action = currentValue ? "Remove super admin?" : "Grant super admin?";
    if (!confirm(action)) return;
    startTransition(async () => {
      try {
        await toggleSuperAdmin(userId, !currentValue);
        toast.success(`Super admin ${currentValue ? "removed" : "granted"}`);
      } catch (error) {
        toast.error((error as Error).message ?? "Failed");
      }
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={isPending}
    >
      {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
      {currentValue ? "Revoke Super Admin" : "Make Super Admin"}
    </Button>
  );
}
