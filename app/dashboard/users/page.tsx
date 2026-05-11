import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { userOrganizationRoles, organizations, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import AddUserForm from "@/components/users/AddUserForm";
import RemoveUserButton from "@/components/users/RemoveUserButton";

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const memberships = await db
    .select({ role: userOrganizationRoles.role, org: organizations })
    .from(userOrganizationRoles)
    .innerJoin(organizations, eq(userOrganizationRoles.organizationId, organizations.id))
    .where(eq(userOrganizationRoles.userId, session.user.id));

  const leadership = memberships.find(
    (m) => m.role === "ward_leader" || m.role === "stake_leader"
  );

  if (!leadership && !session.user.isSuperAdmin) redirect("/dashboard");

  const orgId = leadership?.org.id;
  if (!orgId) redirect("/dashboard");

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
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Ward Users</h1>

      <div className="divide-y border rounded-lg bg-white overflow-hidden">
        {wardUsers.map((u) => (
          <div key={u.roleId} className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">{u.userName ?? u.userEmail}</p>
              <p className="text-sm text-muted-foreground">{u.userEmail}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">
                {u.role.replace("_", " ")}
              </Badge>
              {u.userId !== session.user.id && (
                <RemoveUserButton roleId={u.roleId} />
              )}
            </div>
          </div>
        ))}
      </div>

      <AddUserForm organizationId={orgId} />
    </div>
  );
}
