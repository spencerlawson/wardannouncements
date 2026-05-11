"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  announcements,
  announcementAttachments,
  announcementHistory,
  userOrganizationRoles,
  organizations,
  users,
} from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  sendApprovalRequestEmail,
  sendApprovedEmail,
  sendRevisionRequestedEmail,
} from "@/lib/email";
import { canApproveAnnouncements, getUserRolesInOrg } from "@/lib/permissions";

type Attachment = {
  fileUrl: string;
  fileName: string;
  fileType: "image" | "document";
  fileSize: number;
};

export async function createAnnouncement({
  organizationId,
  title,
  body,
  displayStartDate,
  displayEndDate,
  attachments: atts,
  submit,
}: {
  organizationId: string;
  title: string;
  body: string;
  displayStartDate: string;
  displayEndDate: string;
  attachments: Attachment[];
  submit: boolean;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const status = submit ? ("submitted" as const) : ("draft" as const);

  const [newAnn] = await db
    .insert(announcements)
    .values({ organizationId, title, body, displayStartDate, displayEndDate, status, createdBy: session.user.id })
    .returning();

  await db.insert(announcementHistory).values({
    announcementId: newAnn.id,
    status,
    changedBy: session.user.id,
  });

  if (atts.length > 0) {
    await db.insert(announcementAttachments).values(
      atts.map((att) => ({ announcementId: newAnn.id, ...att }))
    );
  }

  if (submit) {
    await notifyLeadersOfSubmission(
      organizationId,
      title,
      newAnn.id,
      session.user.name ?? session.user.email ?? "Someone"
    );
  }

  revalidatePath("/dashboard/announcements");
  redirect(`/dashboard/announcements/${newAnn.id}`);
}

export async function submitAnnouncement(announcementId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const [ann] = await db
    .select({
      organizationId: announcements.organizationId,
      title: announcements.title,
      createdBy: announcements.createdBy,
    })
    .from(announcements)
    .where(eq(announcements.id, announcementId));

  if (!ann) throw new Error("Not found");
  if (ann.createdBy !== session.user.id && !session.user.isSuperAdmin) throw new Error("Forbidden");

  await db
    .update(announcements)
    .set({ status: "submitted", updatedAt: new Date() })
    .where(eq(announcements.id, announcementId));

  await db.insert(announcementHistory).values({
    announcementId,
    status: "submitted",
    changedBy: session.user.id,
  });

  await notifyLeadersOfSubmission(
    ann.organizationId,
    ann.title,
    announcementId,
    session.user.name ?? session.user.email ?? "Someone"
  );

  revalidatePath(`/dashboard/announcements/${announcementId}`);
  revalidatePath("/dashboard/announcements");
}

export async function approveAnnouncement(announcementId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const [ann] = await db
    .select({
      organizationId: announcements.organizationId,
      title: announcements.title,
      createdBy: announcements.createdBy,
    })
    .from(announcements)
    .where(eq(announcements.id, announcementId));

  if (!ann) throw new Error("Not found");

  const roles = await getUserRolesInOrg(session.user.id, ann.organizationId);
  if (!canApproveAnnouncements(roles, session.user.isSuperAdmin)) throw new Error("Forbidden");

  await db
    .update(announcements)
    .set({ status: "approved", approvedBy: session.user.id, approvedAt: new Date(), updatedAt: new Date() })
    .where(eq(announcements.id, announcementId));

  await db.insert(announcementHistory).values({
    announcementId,
    status: "approved",
    changedBy: session.user.id,
  });

  const [[creator], [org]] = await Promise.all([
    db.select({ email: users.email }).from(users).where(eq(users.id, ann.createdBy)),
    db.select({ name: organizations.name }).from(organizations).where(eq(organizations.id, ann.organizationId)),
  ]);

  if (creator?.email && org) {
    await sendApprovedEmail({
      to: creator.email,
      announcementTitle: ann.title,
      wardName: org.name,
      approvedBy: session.user.name ?? session.user.email ?? "Ward Leader",
    });
  }

  revalidatePath(`/dashboard/announcements/${announcementId}`);
  revalidatePath("/dashboard/announcements");
}

export async function requestRevision(announcementId: string, notes: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const [ann] = await db
    .select({
      organizationId: announcements.organizationId,
      title: announcements.title,
      createdBy: announcements.createdBy,
    })
    .from(announcements)
    .where(eq(announcements.id, announcementId));

  if (!ann) throw new Error("Not found");

  const roles = await getUserRolesInOrg(session.user.id, ann.organizationId);
  if (!canApproveAnnouncements(roles, session.user.isSuperAdmin)) throw new Error("Forbidden");

  await db
    .update(announcements)
    .set({ status: "revision_requested", updatedAt: new Date() })
    .where(eq(announcements.id, announcementId));

  await db.insert(announcementHistory).values({
    announcementId,
    status: "revision_requested",
    changedBy: session.user.id,
    notes,
  });

  const [[creator], [org]] = await Promise.all([
    db.select({ email: users.email }).from(users).where(eq(users.id, ann.createdBy)),
    db.select({ name: organizations.name }).from(organizations).where(eq(organizations.id, ann.organizationId)),
  ]);

  if (creator?.email && org) {
    await sendRevisionRequestedEmail({
      to: creator.email,
      announcementTitle: ann.title,
      announcementId,
      wardName: org.name,
      notes,
      reviewedBy: session.user.name ?? session.user.email ?? "Ward Leader",
    });
  }

  revalidatePath(`/dashboard/announcements/${announcementId}`);
  revalidatePath("/dashboard/announcements");
}

export async function updateAnnouncement({
  announcementId,
  title,
  body,
  displayStartDate,
  displayEndDate,
  newAttachments,
  removedAttachmentIds,
  submit,
}: {
  announcementId: string;
  title: string;
  body: string;
  displayStartDate: string;
  displayEndDate: string;
  newAttachments: Attachment[];
  removedAttachmentIds: string[];
  submit: boolean;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const [ann] = await db
    .select({ organizationId: announcements.organizationId, createdBy: announcements.createdBy })
    .from(announcements)
    .where(eq(announcements.id, announcementId));

  if (!ann) throw new Error("Not found");
  if (ann.createdBy !== session.user.id && !session.user.isSuperAdmin) throw new Error("Forbidden");

  const status = submit ? ("submitted" as const) : ("draft" as const);

  await db
    .update(announcements)
    .set({ title, body, displayStartDate, displayEndDate, status, updatedAt: new Date() })
    .where(eq(announcements.id, announcementId));

  await db.insert(announcementHistory).values({
    announcementId,
    status,
    changedBy: session.user.id,
  });

  if (removedAttachmentIds.length > 0) {
    await db
      .delete(announcementAttachments)
      .where(inArray(announcementAttachments.id, removedAttachmentIds));
  }

  if (newAttachments.length > 0) {
    await db.insert(announcementAttachments).values(
      newAttachments.map((att) => ({ announcementId, ...att }))
    );
  }

  if (submit) {
    await notifyLeadersOfSubmission(
      ann.organizationId,
      title,
      announcementId,
      session.user.name ?? session.user.email ?? "Someone"
    );
  }

  revalidatePath(`/dashboard/announcements/${announcementId}`);
  redirect(`/dashboard/announcements/${announcementId}`);
}

async function notifyLeadersOfSubmission(
  organizationId: string,
  title: string,
  announcementId: string,
  submittedBy: string
) {
  const [leaders, [org]] = await Promise.all([
    db
      .select({ email: users.email })
      .from(userOrganizationRoles)
      .innerJoin(users, eq(userOrganizationRoles.userId, users.id))
      .where(
        and(
          eq(userOrganizationRoles.organizationId, organizationId),
          inArray(userOrganizationRoles.role, ["ward_leader", "stake_leader"])
        )
      ),
    db.select({ name: organizations.name }).from(organizations).where(eq(organizations.id, organizationId)),
  ]);

  if (leaders.length > 0 && org) {
    await sendApprovalRequestEmail({
      to: leaders.map((l) => l.email!).filter(Boolean),
      announcementTitle: title,
      announcementId,
      wardName: org.name,
      submittedBy,
    });
  }
}
