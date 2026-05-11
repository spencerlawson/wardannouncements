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
  SelectValue,
} from "@/components/ui/select";
import { createOrganization, updateOrganization } from "@/lib/actions/organizations";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { Organization } from "@/lib/db/schema";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Phoenix",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
];

export default function OrgForm({ org }: { org?: Organization }) {
  const [name, setName] = useState(org?.name ?? "");
  const [slug, setSlug] = useState(org?.slug ?? "");
  const [type, setType] = useState<"ward" | "stake">(org?.type ?? "ward");
  const [timezone, setTimezone] = useState(org?.timezone ?? "America/Denver");
  const [primaryColor, setPrimaryColor] = useState(org?.primaryColor ?? "#1a365d");
  const [secondaryColor, setSecondaryColor] = useState(org?.secondaryColor ?? "#e2e8f0");
  const [firstLeaderEmail, setFirstLeaderEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  const autoSlug = (n: string) =>
    n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleNameChange = (n: string) => {
    setName(n);
    if (!org) setSlug(autoSlug(n));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    startTransition(async () => {
      try {
        if (org) {
          await updateOrganization(org.id, { name, slug, timezone, primaryColor, secondaryColor });
          toast.success("Organization updated");
        } else {
          await createOrganization({
            name,
            slug,
            type,
            timezone,
            primaryColor,
            secondaryColor,
            firstLeaderEmail: firstLeaderEmail || undefined,
          });
        }
      } catch (error) {
        toast.error((error as Error).message ?? "Failed");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-white border rounded-xl p-6">
      <div className="space-y-1.5">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Sunnyvale 1st Ward"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="slug">URL Slug *</Label>
        <Input
          id="slug"
          value={slug}
          onChange={(e) => setSlug(autoSlug(e.target.value))}
          placeholder="sunnyvale-1st-ward"
          required
        />
      </div>

      {!org && (
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => v && setType(v as "ward" | "stake")}>
            <SelectTrigger>
              {type === "ward" ? "Ward" : "Stake"}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ward">Ward</SelectItem>
              <SelectItem value="stake">Stake</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Timezone</Label>
        <Select value={timezone} onValueChange={(v) => v && setTimezone(v)}>
          <SelectTrigger>
            {timezone.replace(/_/g, " ")}
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tz.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Primary Color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-9 w-14 rounded border cursor-pointer"
            />
            <Input
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Secondary Color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="h-9 w-14 rounded border cursor-pointer"
            />
            <Input
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
        </div>
      </div>

      {!org && (
        <div className="space-y-1.5">
          <Label htmlFor="leader">
            First Ward Leader Email
            <span className="ml-1.5 text-xs text-muted-foreground font-normal">(optional — must have signed in first)</span>
          </Label>
          <Input
            id="leader"
            type="email"
            value={firstLeaderEmail}
            onChange={(e) => setFirstLeaderEmail(e.target.value)}
            placeholder="leader@example.com"
          />
        </div>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
        {org ? "Save Changes" : "Create Organization"}
      </Button>
    </form>
  );
}
