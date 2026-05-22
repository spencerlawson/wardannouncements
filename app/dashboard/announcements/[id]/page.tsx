import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  announcements,
  announcementAttachments,
  announcementAuxiliaries,
  announcementHistory,
  organizations,
  users,
  userOrganizationRoles,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import AnnouncementActions from "@/components/announcements/AnnouncementActions";
import DeleteAnnouncementButton from "@/components/announcements/DeleteAnnouncementButton";
import PinButton from "@/components/announcements/PinButton";
import { AUXILIARY_COLORS } from "@/lib/constants/auxiliaries";
import { Paperclip, Pencil, Pin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const statusLabels: Record<string, string> = {
  draft: "Draft",
  submitted: "Awaiting Approval",
  approved: "Approved",
  revision_requested: "Needs Revision",
};

const statusVariants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "secondary",
  submitted: "outline",
  approved: "default",
  revision_requested: "destructive",
};

export default async function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const [announcement] = await db
    .select({
      announcement: announcements,
      org: organizations,
      creator: users,
    })
    .from(announcements)
    .innerJoin(organizations, eq(announcements.organizationId, organizations.id))
    .innerJoin(users, eq(announcements.createdBy, users.id))
    .where(eq(announcements.id, id));

  if (!announcement) notFound();

  const [userRole] = await db
    .select({ role: userOrganizationRoles.role })
    .from(userOrganizationRoles)
    .where(
      and(
        eq(userOrganizationRoles.userId, session.user.id),
        eq(userOrganizationRoles.organizationId, announcement.org.id)
      )
    );

  const isOwner = announcement.announcement.createdBy === session.user.id;
  const isLeader =
    session.user.isSuperAdmin ||
    userRole?.role === "ward_leader" ||
    userRole?.role === "stake_leader";

  if (!isOwner && !isLeader) redirect("/dashboard");

  const [attachments, auxRows] = await Promise.all([
    db.select().from(announcementAttachments).where(eq(announcementAttachments.announcementId, id)),
    db.select().from(announcementAuxiliaries).where(eq(announcementAuxiliaries.announcementId, id)),
  ]);

  const history = await db
    .select({
      id: announcementHistory.id,
      status: announcementHistory.status,
      notes: announcementHistory.notes,
      createdAt: announcementHistory.createdAt,
      changedByName: users.name,
    })
    .from(announcementHistory)
    .innerJoin(users, eq(announcementHistory.changedBy, users.id))
    .where(eq(announcementHistory.announcementId, id))
    .orderBy(announcementHistory.createdAt);

  const { announcement: a, org } = announcement;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{a.title}</h1>
          <p className="text-sm text-muted-foreground">
            {org.name} · {format(new Date(a.displayStartDate), "MMM d")} –{" "}
            {format(new Date(a.displayEndDate), "MMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={statusVariants[a.status]}>{statusLabels[a.status]}</Badge>
          {(isLeader || (isOwner && (a.status === "draft" || a.status === "revision_requested"))) && (
            <Link href={`/dashboard/announcements/${a.id}/edit`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            </Link>
          )}
          {(isLeader || (isOwner && (a.status === "draft" || a.status === "revision_requested"))) && (
            <DeleteAnnouncementButton announcementId={a.id} />
          )}
        </div>
      </div>

      {/* Auxiliary tags + pin status */}
      <div className="flex flex-wrap items-center gap-2">
        {auxRows.map((row) => {
          const color = AUXILIARY_COLORS[row.auxiliary] ?? "#64748b";
          return (
            <span
              key={row.id}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: `${color}20`, color: color, border: `1px solid ${color}40` }}
            >
              {row.auxiliary}
            </span>
          );
        })}
        {a.isPinned && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Pin className="h-3 w-3" />
            Pinned
          </span>
        )}
        {isLeader && (
          <PinButton
            announcementId={a.id}
            isPinned={a.isPinned}
          />
        )}
      </div>

      {/* Actions available based on role and status */}
      <AnnouncementActions
        announcementId={a.id}
        status={a.status}
        isOwner={isOwner}
        isLeader={isLeader}
      />

      {/* Header image preview */}
      {a.headerImageUrl && (
        <div className="relative aspect-video w-full rounded-xl overflow-hidden border">
          <Image src={a.headerImageUrl} alt={a.title} fill className="object-cover" />
        </div>
      )}

      {/* Body */}
      <div
        className="prose prose-sm max-w-none border rounded-lg p-6 bg-white"
        dangerouslySetInnerHTML={{ __html: a.body }}
      />

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Attachments</p>
          <div className="space-y-1.5">
            {attachments.map((att) => (
              <a
                key={att.id}
                href={att.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-500 hover:underline"
              >
                <Paperclip className="h-4 w-4 shrink-0" />
                {att.fileName}
              </a>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* History */}
      <div className="space-y-3">
        <p className="text-sm font-medium">History</p>
        <div className="space-y-2">
          {history.map((entry) => (
            <div key={entry.id} className="text-sm">
              <span className="text-muted-foreground">
                {format(new Date(entry.createdAt), "MMM d, h:mm a")}
              </span>
              {" · "}
              <span className="font-medium">{entry.changedByName}</span>
              {" → "}
              <span>{statusLabels[entry.status]}</span>
              {entry.notes && (
                <blockquote className="mt-1 ml-4 pl-3 border-l-2 border-muted text-muted-foreground">
                  {entry.notes}
                </blockquote>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
