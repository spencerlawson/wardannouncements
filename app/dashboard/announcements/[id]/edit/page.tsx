import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { announcements, announcementAttachments, organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getUserRolesInOrg, canApproveAnnouncements } from "@/lib/permissions";
import EditAnnouncementForm from "@/components/announcements/EditAnnouncementForm";

export default async function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const [row] = await db
    .select({ announcement: announcements, org: organizations })
    .from(announcements)
    .innerJoin(organizations, eq(announcements.organizationId, organizations.id))
    .where(eq(announcements.id, id));

  if (!row) notFound();

  const { announcement, org } = row;

  const isOwner = announcement.createdBy === session.user.id;
  const roles = await getUserRolesInOrg(session.user.id, announcement.organizationId);
  const isLeader = canApproveAnnouncements(roles, session.user.isSuperAdmin);
  const canEdit = isLeader || (isOwner && (announcement.status === "draft" || announcement.status === "revision_requested"));

  if (!canEdit) redirect(`/dashboard/announcements/${id}`);

  const attachments = await db
    .select()
    .from(announcementAttachments)
    .where(eq(announcementAttachments.announcementId, id));

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Edit Announcement</h1>
      <EditAnnouncementForm
        announcement={announcement}
        org={{ id: org.id, name: org.name }}
        existingAttachments={attachments}
      />
    </div>
  );
}
