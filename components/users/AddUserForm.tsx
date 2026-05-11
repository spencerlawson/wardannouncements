"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { addUserToOrg } from "@/lib/actions/users";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";

export default function AddUserForm({ organizationId }: { organizationId: string }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"ward_leader" | "announcement_poster">("announcement_poster");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    startTransition(async () => {
      try {
        await addUserToOrg({ organizationId, email: email.trim(), name: name.trim() || undefined, role });
        toast.success("User added");
        setEmail("");
        setName("");
      } catch (error) {
        toast.error((error as Error).message ?? "Failed to add user");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white border rounded-xl p-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="member@example.com"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name (optional)"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Role</Label>
        <Select value={role} onValueChange={(v) => v && setRole(v as typeof role)}>
          <SelectTrigger className="w-56">
            {role === "ward_leader" ? "Ward Leader" : "Announcement Poster"}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="announcement_poster">Announcement Poster</SelectItem>
            <SelectItem value="ward_leader">Ward Leader</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isPending} className="gap-1.5">
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
        Add User
      </Button>
    </form>
  );
}
