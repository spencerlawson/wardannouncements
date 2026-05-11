"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { removeUserFromOrg } from "@/lib/actions/users";
import { toast } from "sonner";
import { Loader2, UserMinus } from "lucide-react";

export default function RemoveUserButton({ roleId }: { roleId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleRemove = () => {
    if (!confirm("Remove this user from the ward?")) return;
    startTransition(async () => {
      try {
        await removeUserFromOrg(roleId);
        toast.success("User removed");
      } catch (error) {
        toast.error((error as Error).message ?? "Failed to remove user");
      }
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-muted-foreground hover:text-destructive"
      onClick={handleRemove}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <UserMinus className="h-4 w-4" />
      )}
    </Button>
  );
}
