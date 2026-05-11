import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { userOrganizationRoles, organizations, announcements } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ExternalLink } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const memberships = await db
    .select({
      role: userOrganizationRoles.role,
      org: organizations,
    })
    .from(userOrganizationRoles)
    .innerJoin(organizations, eq(userOrganizationRoles.organizationId, organizations.id))
    .where(eq(userOrganizationRoles.userId, session.user.id));

  if (memberships.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg font-medium">You are not assigned to any ward yet.</p>
        <p className="text-sm mt-1">Contact your ward administrator to be added.</p>
      </div>
    );
  }

  // Count pending announcements for each org the user leads
  const pendingCounts = await Promise.all(
    memberships
      .filter((m) => m.role === "ward_leader" || m.role === "stake_leader")
      .map(async (m) => {
        const [result] = await db
          .select({ count: count() })
          .from(announcements)
          .where(
            and(
              eq(announcements.organizationId, m.org.id),
              eq(announcements.status, "submitted")
            )
          );
        return { orgId: m.org.id, pending: result?.count ?? 0 };
      })
  );
  const pendingByOrg = Object.fromEntries(pendingCounts.map((p) => [p.orgId, p.pending]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Link href="/dashboard/announcements/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Announcement
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {memberships.map(({ org, role }) => (
          <Card key={org.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">{org.name}</CardTitle>
                <Badge variant="secondary" className="capitalize text-xs">
                  {role.replace("_", " ")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingByOrg[org.id] > 0 && (
                <p className="text-sm text-amber-600 font-medium">
                  {pendingByOrg[org.id]} announcement{pendingByOrg[org.id] !== 1 ? "s" : ""} awaiting approval
                </p>
              )}
              <div className="flex gap-2">
                <Link href="/dashboard/announcements" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    Announcements
                  </Button>
                </Link>
                <Link href={`/ward/${org.slug}`} target="_blank">
                  <Button variant="ghost" size="sm" className="gap-1">
                    Public site
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
