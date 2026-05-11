import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { userOrganizationRoles, organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import WardSettingsForm from "@/components/ward/WardSettingsForm";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const memberships = await db
    .select({ role: userOrganizationRoles.role, org: organizations })
    .from(userOrganizationRoles)
    .innerJoin(organizations, eq(userOrganizationRoles.organizationId, organizations.id))
    .where(eq(userOrganizationRoles.userId, session.user.id));

  const leaderships = memberships.filter(
    (m) => m.role === "ward_leader" || m.role === "stake_leader"
  );

  if (leaderships.length === 0 && !session.user.isSuperAdmin) redirect("/dashboard");

  const ward = leaderships[0]?.org;
  if (!ward) redirect("/dashboard");

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Ward Settings</h1>
      <WardSettingsForm ward={ward} />
    </div>
  );
}
