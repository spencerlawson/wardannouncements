"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { programs, programItems, userOrganizationRoles, organizations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManagePrograms, getUserRolesInOrg } from "@/lib/permissions";
import type { ProgramType, ProgramItemType } from "@/lib/db/schema";

type ItemInput = {
  type: ProgramItemType;
  label: string | null;
  detail: string | null;
  secondaryDetail: string | null;
  isCongregalional: boolean;
};

type ProgramInput = {
  organizationId: string;
  date: string;
  type: ProgramType;
  title: string | null;
  sessionLabel: string | null;
  presiding: string | null;
  conducting: string | null;
  theme: string | null;
  icon: string | null;
  status: "draft" | "published";
  items: ItemInput[];
};

async function assertCanManage(userId: string, organizationId: string, isSuperAdmin: boolean) {
  const roles = await getUserRolesInOrg(userId, organizationId);
  if (!canManagePrograms(roles, isSuperAdmin)) throw new Error("Forbidden");
}

export async function createProgram(input: ProgramInput) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await assertCanManage(session.user.id, input.organizationId, session.user.isSuperAdmin);

  const [program] = await db
    .insert(programs)
    .values({
      organizationId: input.organizationId,
      date: input.date,
      type: input.type,
      title: input.title || null,
      sessionLabel: input.sessionLabel || null,
      presiding: input.presiding || null,
      conducting: input.conducting || null,
      theme: input.theme || null,
      icon: input.icon || null,
      status: input.status,
      createdBy: session.user.id,
    })
    .returning();

  if (input.items.length > 0) {
    await db.insert(programItems).values(
      input.items.map((item, i) => ({
        programId: program.id,
        sortOrder: i,
        type: item.type,
        label: item.label || null,
        detail: item.detail || null,
        secondaryDetail: item.secondaryDetail || null,
        isCongregalional: item.isCongregalional,
      }))
    );
  }

  revalidatePath("/dashboard/programs");
  redirect(`/dashboard/programs/${program.id}`);
}

export async function updateProgram(programId: string, input: ProgramInput) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const [existing] = await db
    .select({ organizationId: programs.organizationId })
    .from(programs)
    .where(eq(programs.id, programId));

  if (!existing) throw new Error("Not found");

  await assertCanManage(session.user.id, existing.organizationId, session.user.isSuperAdmin);

  await db
    .update(programs)
    .set({
      date: input.date,
      type: input.type,
      title: input.title || null,
      sessionLabel: input.sessionLabel || null,
      presiding: input.presiding || null,
      conducting: input.conducting || null,
      theme: input.theme || null,
      icon: input.icon || null,
      status: input.status,
      updatedAt: new Date(),
    })
    .where(eq(programs.id, programId));

  await db.delete(programItems).where(eq(programItems.programId, programId));

  if (input.items.length > 0) {
    await db.insert(programItems).values(
      input.items.map((item, i) => ({
        programId,
        sortOrder: i,
        type: item.type,
        label: item.label || null,
        detail: item.detail || null,
        secondaryDetail: item.secondaryDetail || null,
        isCongregalional: item.isCongregalional,
      }))
    );
  }

  const [org] = await db
    .select({ slug: organizations.slug })
    .from(organizations)
    .where(eq(organizations.id, existing.organizationId));

  if (org) revalidatePath(`/ward/${org.slug}`);
  revalidatePath("/dashboard/programs");
  revalidatePath(`/dashboard/programs/${programId}`);
}

export async function deleteProgram(programId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const [existing] = await db
    .select({ organizationId: programs.organizationId })
    .from(programs)
    .where(eq(programs.id, programId));

  if (!existing) throw new Error("Not found");

  await assertCanManage(session.user.id, existing.organizationId, session.user.isSuperAdmin);

  await db.delete(programs).where(eq(programs.id, programId));

  revalidatePath("/dashboard/programs");
  redirect("/dashboard/programs");
}

export async function getUserLeaderOrgs(userId: string) {
  return db
    .select({ id: organizations.id, name: organizations.name })
    .from(userOrganizationRoles)
    .innerJoin(organizations, eq(userOrganizationRoles.organizationId, organizations.id))
    .where(
      and(
        eq(userOrganizationRoles.userId, userId),
        // ward_leader or stake_leader
        eq(userOrganizationRoles.role, "ward_leader")
      )
    );
}
