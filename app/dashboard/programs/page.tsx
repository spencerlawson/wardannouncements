import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { programs, userOrganizationRoles, organizations } from "@/lib/db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { Plus, Pencil } from "lucide-react";
import { PROGRAM_TYPE_LABELS } from "@/lib/constants/programs";
import OrgSwitcher from "@/components/OrgSwitcher";

export default async function ProgramsPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { org: orgParam } = await searchParams;

  const memberships = await db
    .select({
      orgId: userOrganizationRoles.organizationId,
      role: userOrganizationRoles.role,
      orgName: organizations.name,
    })
    .from(userOrganizationRoles)
    .innerJoin(organizations, eq(userOrganizationRoles.organizationId, organizations.id))
    .where(
      and(
        eq(userOrganizationRoles.userId, session.user.id),
        inArray(userOrganizationRoles.role, ["ward_leader", "stake_leader"])
      )
    );

  if (memberships.length === 0 && !session.user.isSuperAdmin) redirect("/dashboard");

  const allOrgs = memberships.map((m) => ({ id: m.orgId, name: m.orgName }));
  const activeOrg =
    (orgParam ? allOrgs.find((o) => o.id === orgParam) : undefined) ?? allOrgs[0];

  const rows = !activeOrg
    ? []
    : await db
        .select()
        .from(programs)
        .where(eq(programs.organizationId, activeOrg.id))
        .orderBy(desc(programs.date), desc(programs.createdAt))
        .limit(100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold">Programs</h1>
          {allOrgs.length > 1 && activeOrg && (
            <OrgSwitcher orgs={allOrgs} currentOrgId={activeOrg.id} />
          )}
        </div>
        <Link href={`/dashboard/programs/new${activeOrg ? `?org=${activeOrg.id}` : ""}`}>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Program
          </Button>
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No programs yet.{" "}
          <Link href="/dashboard/programs/new" className="underline">
            Create one
          </Link>
          .
        </div>
      ) : (
        <div className="divide-y border rounded-lg bg-white overflow-hidden">
          {rows.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-4 gap-3">
              <Link
                href={`/dashboard/programs/${p.id}`}
                className="flex-1 min-w-0 hover:opacity-80 transition-opacity"
              >
                <p className="font-medium truncate">
                  {p.title || PROGRAM_TYPE_LABELS[p.type]}
                </p>
                <p className="text-sm text-muted-foreground">
                  {activeOrg?.name} · {format(parseISO(p.date), "MMM d, yyyy")}
                  {p.sessionLabel && ` · ${p.sessionLabel}`}
                </p>
              </Link>
              <div className="flex items-center gap-2 shrink-0">
                {p.status === "published" && !p.isActive && (
                  <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                    Hidden
                  </Badge>
                )}
                <Badge variant={p.status === "published" ? "default" : "secondary"}>
                  {p.status === "published" ? "Published" : "Draft"}
                </Badge>
                <Link href={`/dashboard/programs/${p.id}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
