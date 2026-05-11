import { db } from "@/lib/db";
import { userOrganizationRoles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { OrgRole } from "@/lib/db/schema";

export async function getUserRolesInOrg(
  userId: string,
  organizationId: string
): Promise<OrgRole[]> {
  const rows = await db
    .select({ role: userOrganizationRoles.role })
    .from(userOrganizationRoles)
    .where(
      and(
        eq(userOrganizationRoles.userId, userId),
        eq(userOrganizationRoles.organizationId, organizationId)
      )
    );
  return rows.map((r) => r.role);
}

export function canManageOrg(roles: OrgRole[], isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  return roles.some((r) => r === "ward_leader" || r === "stake_leader");
}

export function canApproveAnnouncements(roles: OrgRole[], isSuperAdmin: boolean): boolean {
  return canManageOrg(roles, isSuperAdmin);
}

export function canPostAnnouncements(roles: OrgRole[], isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  return roles.length > 0;
}

export function canManageUsers(roles: OrgRole[], isSuperAdmin: boolean): boolean {
  return canManageOrg(roles, isSuperAdmin);
}
