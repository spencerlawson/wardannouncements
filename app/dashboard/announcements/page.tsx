import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { userOrganizationRoles, announcements, users, organizations } from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Plus, Pencil } from "lucide-react";
import DeleteAnnouncementButton from "@/components/announcements/DeleteAnnouncementButton";

const statusColors: Record<string, string> = {
  draft: "secondary",
  submitted: "outline",
  approved: "default",
  revision_requested: "destructive",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  submitted: "Awaiting Approval",
  approved: "Approved",
  revision_requested: "Needs Revision",
};

export default async function AnnouncementsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Get user's orgs
  const memberships = await db
    .select({ orgId: userOrganizationRoles.organizationId, role: userOrganizationRoles.role })
    .from(userOrganizationRoles)
    .where(eq(userOrganizationRoles.userId, session.user.id));

  const orgIds = memberships.map((m) => m.orgId);
  const isLeaderOf = new Set(
    memberships
      .filter((m) => m.role === "ward_leader" || m.role === "stake_leader")
      .map((m) => m.orgId)
  );

  // Leaders see all org announcements; posters see only their own
  const rows = orgIds.length === 0 ? [] : await db
    .select({
      id: announcements.id,
      title: announcements.title,
      status: announcements.status,
      displayStartDate: announcements.displayStartDate,
      displayEndDate: announcements.displayEndDate,
      createdAt: announcements.createdAt,
      orgName: organizations.name,
      orgId: organizations.id,
      createdByName: users.name,
      createdById: announcements.createdBy,
    })
    .from(announcements)
    .innerJoin(organizations, eq(announcements.organizationId, organizations.id))
    .innerJoin(users, eq(announcements.createdBy, users.id))
    .where(inArray(announcements.organizationId, orgIds))
    .orderBy(desc(announcements.createdAt))
    .limit(100);

  // Filter: leaders see all in their orgs, posters see only own
  const visible = rows.filter(
    (r) =>
      isLeaderOf.has(r.orgId) ||
      session.user.isSuperAdmin ||
      r.createdById === session.user.id
  );

  const canEdit = (r: typeof visible[0]) =>
    isLeaderOf.has(r.orgId) ||
    session.user.isSuperAdmin ||
    (r.createdById === session.user.id && (r.status === "draft" || r.status === "revision_requested"));

  const canDelete = canEdit;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Announcements</h1>
        <Link href="/dashboard/announcements/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            New
          </Button>
        </Link>
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No announcements yet.{" "}
          <Link href="/dashboard/announcements/new" className="underline">
            Create one
          </Link>
          .
        </div>
      ) : (
        <div className="divide-y border rounded-lg bg-white overflow-hidden">
          {visible.map((a) => (
            <div key={a.id} className="flex items-center justify-between p-4 gap-3">
              <Link
                href={`/dashboard/announcements/${a.id}`}
                className="flex-1 min-w-0 hover:opacity-80 transition-opacity"
              >
                <p className="font-medium truncate">{a.title}</p>
                <p className="text-sm text-muted-foreground">
                  {a.orgName} · {format(new Date(a.displayStartDate), "MMM d")} –{" "}
                  {format(new Date(a.displayEndDate), "MMM d, yyyy")}
                </p>
              </Link>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={statusColors[a.status] as any}>
                  {statusLabels[a.status]}
                </Badge>
                {canEdit(a) && (
                  <Link href={`/dashboard/announcements/${a.id}/edit`}>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}
                {canDelete(a) && (
                  <DeleteAnnouncementButton announcementId={a.id} iconOnly />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
