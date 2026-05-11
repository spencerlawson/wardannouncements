import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { userOrganizationRoles, organizations, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import AddUserForm from "@/components/users/AddUserForm";
import RemoveUserButton from "@/components/users/RemoveUserButton";
import EditUserRoleSelect from "@/components/users/EditUserRoleSelect";
import CSVUploadForm from "@/components/users/CSVUploadForm";
import OrgSwitcher from "@/components/OrgSwitcher";
import { Badge } from "@/components/ui/badge";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { org: orgParam } = await searchParams;

  const memberships = await db
    .select({ role: userOrganizationRoles.role, org: organizations })
    .from(userOrganizationRoles)
    .innerJoin(organizations, eq(userOrganizationRoles.organizationId, organizations.id))
    .where(eq(userOrganizationRoles.userId, session.user.id));

  const leaderships = memberships.filter(
    (m) => m.role === "ward_leader" || m.role === "stake_leader"
  );

  if (leaderships.length === 0 && !session.user.isSuperAdmin) redirect("/dashboard");

  const leadership =
    (orgParam ? leaderships.find((m) => m.org.id === orgParam) : undefined) ??
    leaderships[0];

  const orgId = leadership?.org.id ?? "";
  const orgName = leadership?.org.name ?? "";
  const leaderOrgs = leaderships.map((m) => ({ id: m.org.id, name: m.org.name }));

  const wardUsers = await db
    .select({
      roleId: userOrganizationRoles.id,
      role: userOrganizationRoles.role,
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
    })
    .from(userOrganizationRoles)
    .innerJoin(users, eq(userOrganizationRoles.userId, users.id))
    .where(eq(userOrganizationRoles.organizationId, orgId))
    .orderBy(users.name);

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Ward Users</h1>
          <p className="text-sm text-muted-foreground mt-1">{orgName} · {wardUsers.length} member{wardUsers.length !== 1 ? "s" : ""}</p>
        </div>
        {leaderOrgs.length > 1 && (
          <OrgSwitcher orgs={leaderOrgs} currentOrgId={orgId} />
        )}
      </div>

      {/* Member list */}
      <div className="space-y-2">
        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Members</h2>
        {wardUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No members yet.</p>
        ) : (
          <div className="divide-y border rounded-lg bg-white overflow-hidden">
            {wardUsers.map((u) => (
              <div key={u.roleId} className="flex items-center justify-between p-3 gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{u.userName ?? <span className="text-muted-foreground italic">No name</span>}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.userEmail}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {u.role === "stake_leader" ? (
                    <Badge variant="secondary" className="text-xs">Stake Leader</Badge>
                  ) : (
                    <EditUserRoleSelect roleId={u.roleId} currentRole={u.role as "ward_leader" | "announcement_poster"} />
                  )}
                  {u.userId !== session.user.id && (
                    <RemoveUserButton roleId={u.roleId} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add single user */}
      <div className="space-y-2">
        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Add User</h2>
        <AddUserForm organizationId={orgId} />
      </div>

      {/* CSV bulk upload */}
      <div className="space-y-2">
        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Bulk Upload via CSV</h2>
        <CSVUploadForm organizationId={orgId} />
      </div>
    </div>
  );
}
