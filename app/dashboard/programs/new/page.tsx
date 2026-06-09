import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { userOrganizationRoles, organizations } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import ProgramBuilder from "@/components/programs/ProgramBuilder";

export default async function NewProgramPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { org: orgParam } = await searchParams;

  const memberships = await db
    .select({ org: organizations })
    .from(userOrganizationRoles)
    .innerJoin(organizations, eq(userOrganizationRoles.organizationId, organizations.id))
    .where(
      and(
        eq(userOrganizationRoles.userId, session.user.id),
        inArray(userOrganizationRoles.role, ["ward_leader", "stake_leader"])
      )
    );

  if (memberships.length === 0 && !session.user.isSuperAdmin) redirect("/dashboard");

  const orgs = memberships.map((m) => ({ id: m.org.id, name: m.org.name }));

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">New Program</h1>
      <ProgramBuilder orgs={orgs} defaultOrgId={orgParam} />
    </div>
  );
}
