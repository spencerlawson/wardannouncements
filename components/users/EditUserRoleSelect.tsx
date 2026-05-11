"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { updateUserRole } from "@/lib/actions/users";
import { toast } from "sonner";

export default function EditUserRoleSelect({
  roleId,
  currentRole,
}: {
  roleId: string;
  currentRole: "ward_leader" | "announcement_poster";
}) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (value: string | null) => {
    if (!value || value === currentRole) return;
    startTransition(async () => {
      try {
        await updateUserRole(roleId, value as "ward_leader" | "announcement_poster");
        toast.success("Role updated");
      } catch (error) {
        toast.error((error as Error).message ?? "Failed to update role");
      }
    });
  };

  return (
    <Select value={currentRole} onValueChange={handleChange}>
      <SelectTrigger className="h-7 text-xs w-44" disabled={isPending}>
        {currentRole === "ward_leader" ? "Ward Leader" : "Announcement Poster"}
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="announcement_poster">Announcement Poster</SelectItem>
        <SelectItem value="ward_leader">Ward Leader</SelectItem>
      </SelectContent>
    </Select>
  );
}
