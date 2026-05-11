"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, userOrganizationRoles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getUserRolesInOrg, canManageUsers } from "@/lib/permissions";

type OrgRole = "ward_leader" | "announcement_poster";

async function requireManagePermission(organizationId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const roles = await getUserRolesInOrg(session.user.id, organizationId);
  if (!canManageUsers(roles, session.user.isSuperAdmin)) throw new Error("Forbidden");
  return session;
}

async function upsertUser(email: string, name?: string) {
  const normalizedEmail = email.toLowerCase().trim();
  let [user] = await db.select().from(users).where(eq(users.email, normalizedEmail));
  if (!user) {
    [user] = await db
      .insert(users)
      .values({ email: normalizedEmail, name: name?.trim() || null })
      .returning();
  } else if (name?.trim() && !user.name) {
    await db.update(users).set({ name: name.trim() }).where(eq(users.id, user.id));
    user = { ...user, name: name.trim() };
  }
  return user;
}

export async function addUserToOrg({
  organizationId,
  email,
  name,
  role,
}: {
  organizationId: string;
  email: string;
  name?: string;
  role: OrgRole;
}) {
  await requireManagePermission(organizationId);

  const targetUser = await upsertUser(email, name);

  const [existing] = await db
    .select()
    .from(userOrganizationRoles)
    .where(
      and(
        eq(userOrganizationRoles.userId, targetUser.id),
        eq(userOrganizationRoles.organizationId, organizationId)
      )
    );

  if (existing) {
    if (existing.role !== role) {
      await db
        .update(userOrganizationRoles)
        .set({ role })
        .where(eq(userOrganizationRoles.id, existing.id));
    }
  } else {
    await db.insert(userOrganizationRoles).values({
      userId: targetUser.id,
      organizationId,
      role,
    });
  }

  revalidatePath("/dashboard/users");
}

export async function updateUserRole(roleId: string, newRole: OrgRole) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const [roleEntry] = await db
    .select()
    .from(userOrganizationRoles)
    .where(eq(userOrganizationRoles.id, roleId));
  if (!roleEntry) throw new Error("Not found");

  const roles = await getUserRolesInOrg(session.user.id, roleEntry.organizationId);
  if (!canManageUsers(roles, session.user.isSuperAdmin)) throw new Error("Forbidden");

  await db
    .update(userOrganizationRoles)
    .set({ role: newRole })
    .where(eq(userOrganizationRoles.id, roleId));

  revalidatePath("/dashboard/users");
}

export async function addUsersFromCSV({
  organizationId,
  csvText,
}: {
  organizationId: string;
  csvText: string;
}) {
  await requireManagePermission(organizationId);

  const lines = csvText.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row.");

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
  const emailIdx = headers.indexOf("email");
  const nameIdx = headers.indexOf("name");
  const roleIdx = headers.indexOf("role");

  if (emailIdx === -1) throw new Error("CSV is missing an 'email' column.");

  let added = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const email = values[emailIdx]?.toLowerCase().trim();
    if (!email) { skipped++; continue; }

    const name = nameIdx !== -1 ? values[nameIdx] : undefined;
    const roleRaw = roleIdx !== -1 ? values[roleIdx]?.toLowerCase().trim() : "";
    const role: OrgRole = roleRaw === "ward_leader" ? "ward_leader" : "announcement_poster";

    try {
      const targetUser = await upsertUser(email, name);
      const [existing] = await db
        .select()
        .from(userOrganizationRoles)
        .where(
          and(
            eq(userOrganizationRoles.userId, targetUser.id),
            eq(userOrganizationRoles.organizationId, organizationId)
          )
        );

      if (existing) {
        if (existing.role !== role) {
          await db.update(userOrganizationRoles).set({ role }).where(eq(userOrganizationRoles.id, existing.id));
          updated++;
        } else {
          skipped++;
        }
      } else {
        await db.insert(userOrganizationRoles).values({ userId: targetUser.id, organizationId, role });
        added++;
      }
    } catch (e) {
      errors.push(`Row ${i + 1} (${email}): ${(e as Error).message}`);
    }
  }

  revalidatePath("/dashboard/users");
  return { added, updated, skipped, errors };
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
