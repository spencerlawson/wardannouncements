import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

export default async function AdminOrganizationsPage() {
  const orgs = await db.select().from(organizations).orderBy(organizations.name);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Organizations</h1>
        <Link href="/admin/organizations/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Organization
          </Button>
        </Link>
      </div>

      <div className="divide-y border rounded-lg bg-white overflow-hidden">
        {orgs.map((org) => (
          <Link
            key={org.id}
            href={`/admin/organizations/${org.id}`}
            className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <p className="font-medium">{org.name}</p>
                <Badge variant="outline" className="capitalize text-xs">
                  {org.type}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                wardannouncements.com/ward/{org.slug}
              </p>
            </div>
            <div
              className="h-6 w-6 rounded-full border"
              style={{ backgroundColor: org.primaryColor }}
              title={org.primaryColor}
            />
          </Link>
        ))}
        {orgs.length === 0 && (
          <p className="p-8 text-center text-muted-foreground">No organizations yet.</p>
        )}
      </div>
    </div>
  );
}
