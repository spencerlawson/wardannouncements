"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, userOrganizationRoles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getUserRolesInOrg, canManageUsers } from "@/lib/permissions";

export async function addUserToOrg({
  organizationId,
  email,
  role,
}: {
  organizationId: string;
  email: string;
  role: "ward_leader" | "announcement_poster";
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const roles = await getUserRolesInOrg(session.user.id, organizationId);
  if (!canManageUsers(roles, session.user.isSuperAdmin)) throw new Error("Forbidden");

  const [targetUser] = await db.select().from(users).where(eq(users.email, email));
  if (!targetUser) {
    throw new Error("User not found. They must sign in at least once first.");
  }

  const [existing] = await db
    .select()
    .from(userOrganizationRoles)
    .where(
      and(
        eq(userOrganizationRoles.userId, targetUser.id),
        eq(userOrganizationRoles.organizationId, organizationId)
      )
    );
  if (existing) throw new Error("User is already a member of this ward.");

  await db.insert(userOrganizationRoles).values({
    userId: targetUser.id,
    organizationId,
    role,
  });

  revalidatePath("/dashboard/users");
}

export async function removeUserFromOrg(roleId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const [roleEntry] = await db
    .select()
    .from(userOrganizationRoles)
    .where(eq(userOrganizationRoles.id, roleId));
  if (!roleEntry) throw new Error("Not found");

  const roles = await getUserRolesInOrg(session.user.id, roleEntry.organizationId);
  if (!canManageUsers(roles, session.user.isSuperAdmin)) throw new Error("Forbidden");

  await db.delete(userOrganizationRoles).where(eq(userOrganizationRoles.id, roleId));

  revalidatePath("/dashboard/users");
}

export async function toggleSuperAdmin(userId: string, newValue: boolean) {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) throw new Error("Forbidden");

  await db.update(users).set({ isSuperAdmin: newValue }).where(eq(users.id, userId));

  revalidatePath("/admin/users");
}
