"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Org {
  id: string;
  name: string;
}

export default function OrgSwitcher({ orgs, currentOrgId }: { orgs: Org[]; currentOrgId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(orgId: string | null) {
    if (!orgId) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("org", orgId);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={currentOrgId} onValueChange={handleChange}>
      <SelectTrigger className="w-56">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {orgs.map((org) => (
          <SelectItem key={org.id} value={org.id}>
            {org.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
