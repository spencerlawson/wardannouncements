import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { userOrganizationRoles, organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import AnnouncementForm from "@/components/announcements/AnnouncementForm";

export default async function NewAnnouncementPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const memberships = await db
    .select({
      role: userOrganizationRoles.role,
      org: organizations,
    })
    .from(userOrganizationRoles)
    .innerJoin(organizations, eq(userOrganizationRoles.organizationId, organizations.id))
    .where(eq(userOrganizationRoles.userId, session.user.id));

  if (memberships.length === 0) redirect("/dashboard");

  const orgsForUser = memberships.map((m) => ({ id: m.org.id, name: m.org.name }));

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">New Announcement</h1>
      <AnnouncementForm orgs={orgsForUser} />
    </div>
  );
}
