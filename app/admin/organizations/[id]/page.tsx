import { db } from "@/lib/db";
import { organizations, userOrganizationRoles, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import OrgForm from "@/components/admin/OrgForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ExternalLink, QrCode, Download } from "lucide-react";
import AddUserForm from "@/components/users/AddUserForm";
import RemoveUserButton from "@/components/users/RemoveUserButton";

export default async function OrgDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
  if (!org) notFound();

  const members = await db
    .select({
      roleId: userOrganizationRoles.id,
      role: userOrganizationRoles.role,
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
    })
    .from(userOrganizationRoles)
    .innerJoin(users, eq(userOrganizationRoles.userId, users.id))
    .where(eq(userOrganizationRoles.organizationId, id))
    .orderBy(users.name);

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{org.name}</h1>
          <p className="text-sm text-muted-foreground capitalize">{org.type} · /ward/{org.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <a href={`/api/qrcode/${org.id}`} download>
            <Button variant="outline" size="sm" className="gap-1.5">
              <QrCode className="h-4 w-4" />
              <Download className="h-4 w-4" />
              QR Code
            </Button>
          </a>
          <Link href={`/ward/${org.slug}`} target="_blank">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ExternalLink className="h-4 w-4" />
              Public Page
            </Button>
          </Link>
        </div>
      </div>

      <OrgForm org={org} />

      {/* User management */}
      <div className="space-y-4">
        <h2 className="font-semibold text-lg">Members</h2>

        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No members yet.</p>
        ) : (
          <div className="divide-y border rounded-lg bg-white overflow-hidden">
            {members.map((m) => (
              <div key={m.roleId} className="flex items-center justify-between p-3">
                <div>
                  <p className="text-sm font-medium">{m.userName ?? m.userEmail}</p>
                  <p className="text-xs text-muted-foreground">{m.userEmail}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs capitalize">
                    {m.role.replace(/_/g, " ")}
                  </Badge>
                  <RemoveUserButton roleId={m.roleId} />
                </div>
              </div>
            ))}
          </div>
        )}

        <AddUserForm organizationId={id} />
      </div>
    </div>
  );
}
