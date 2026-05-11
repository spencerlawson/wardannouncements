import { db } from "@/lib/db";
import { users, userOrganizationRoles, organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import ToggleSuperAdminButton from "@/components/admin/ToggleSuperAdminButton";
import { auth } from "@/lib/auth";

export default async function AdminUsersPage() {
  const session = await auth();

  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      isSuperAdmin: users.isSuperAdmin,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(users.createdAt);

  // Get org memberships for each user
  const allRoles = await db
    .select({
      userId: userOrganizationRoles.userId,
      role: userOrganizationRoles.role,
      orgName: organizations.name,
    })
    .from(userOrganizationRoles)
    .innerJoin(organizations, eq(userOrganizationRoles.organizationId, organizations.id));

  const rolesByUser = allRoles.reduce<Record<string, typeof allRoles>>(
    (acc, r) => {
      if (!acc[r.userId]) acc[r.userId] = [];
      acc[r.userId].push(r);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">All Users ({allUsers.length})</h1>
      </div>

      <div className="divide-y border rounded-lg bg-white overflow-hidden">
        {allUsers.map((u) => (
          <div key={u.id} className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{u.name ?? u.email}</p>
                  {u.isSuperAdmin && <Badge className="text-xs">Super Admin</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {u.email} · Joined {format(new Date(u.createdAt), "MMM d, yyyy")}
                </p>
              </div>
              {u.id !== session?.user.id && (
                <ToggleSuperAdminButton userId={u.id} currentValue={u.isSuperAdmin} />
              )}
            </div>
            {(rolesByUser[u.id] ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(rolesByUser[u.id] ?? []).map((r) => (
                  <Badge key={`${r.userId}-${r.orgName}`} variant="secondary" className="text-xs">
                    {r.orgName} · {r.role.replace("_", " ")}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
