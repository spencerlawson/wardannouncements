"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizations, userOrganizationRoles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUserRolesInOrg, canManageOrg } from "@/lib/permissions";

export async function createOrganization({
  name,
  slug,
  type,
  parentId,
  timezone,
  primaryColor,
  secondaryColor,
  firstLeaderEmail,
}: {
  name: string;
  slug: string;
  type: "ward" | "stake";
  parentId?: string;
  timezone: string;
  primaryColor: string;
  secondaryColor: string;
  firstLeaderEmail?: string;
}) {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) throw new Error("Forbidden");

  const [org] = await db
    .insert(organizations)
    .values({
      name,
      slug,
      type,
      parentId: parentId || undefined,
      timezone,
      primaryColor,
      secondaryColor,
    })
    .returning();

  // Optionally assign first ward leader
  if (firstLeaderEmail) {
    const { users } = await import("@/lib/db/schema");
    const { eq: eqUsers } = await import("drizzle-orm");
    const [leader] = await db.select().from(users).where(eqUsers(users.email, firstLeaderEmail));
    if (leader) {
      await db.insert(userOrganizationRoles).values({
        userId: leader.id,
        organizationId: org.id,
        role: type === "stake" ? "stake_leader" : "ward_leader",
      });
    }
  }

  revalidatePath("/admin/organizations");
  redirect(`/admin/organizations/${org.id}`);
}

export async function updateOrganization(
  orgId: string,
  updates: {
    name?: string;
    slug?: string;
    timezone?: string;
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
    bannerUrl?: string;
  }
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  if (!session.user.isSuperAdmin) {
    const roles = await getUserRolesInOrg(session.user.id, orgId);
    if (!canManageOrg(roles, false)) throw new Error("Forbidden");
  }

  await db
    .update(organizations)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(organizations.id, orgId));

  revalidatePath("/dashboard/settings");
  revalidatePath("/admin/organizations");
}

export async function deleteOrganization(orgId: string) {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) throw new Error("Forbidden");

  await db.delete(organizations).where(eq(organizations.id, orgId));

  revalidatePath("/admin/organizations");
  redirect("/admin/organizations");
}
