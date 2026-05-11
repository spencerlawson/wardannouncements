import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { userOrganizationRoles, organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import WardSettingsForm from "@/components/ward/WardSettingsForm";
import OrgSwitcher from "@/components/OrgSwitcher";
import { Button } from "@/components/ui/button";
import { QrCode, Download } from "lucide-react";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { org: orgParam } = await searchParams;

  const memberships = await db
    .select({ role: userOrganizationRoles.role, org: organizations })
    .from(userOrganizationRoles)
    .innerJoin(organizations, eq(userOrganizationRoles.organizationId, organizations.id))
    .where(eq(userOrganizationRoles.userId, session.user.id));

  const leaderships = memberships.filter(
    (m) => m.role === "ward_leader" || m.role === "stake_leader"
  );

  if (leaderships.length === 0 && !session.user.isSuperAdmin) redirect("/dashboard");

  const ward =
    (orgParam ? leaderships.find((m) => m.org.id === orgParam)?.org : undefined) ??
    leaderships[0]?.org;
  if (!ward) redirect("/dashboard");

  const leaderOrgs = leaderships.map((m) => ({ id: m.org.id, name: m.org.name }));

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold">Ward Settings</h1>
          {leaderOrgs.length > 1 && (
            <OrgSwitcher orgs={leaderOrgs} currentOrgId={ward.id} />
          )}
        </div>
        <a href={`/api/qrcode/${ward.id}`} download>
          <Button variant="outline" size="sm" className="gap-1.5">
            <QrCode className="h-4 w-4" />
            <Download className="h-4 w-4" />
            QR Code
          </Button>
        </a>
      </div>
      <WardSettingsForm ward={ward} />
    </div>
  );
}
