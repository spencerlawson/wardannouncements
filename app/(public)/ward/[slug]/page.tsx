import { db } from "@/lib/db";
import { organizations, announcements, announcementAttachments } from "@/lib/db/schema";
import { eq, and, lte, gte, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getWeekBounds, weekOffsetLabel } from "@/lib/utils/weeks";
import Image from "next/image";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const revalidate = 60; // refresh cached page every 60 seconds

export default async function WardPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ week?: string }>;
}) {
  const { slug } = await params;
  const { week } = await searchParams;
  const weekOffset = parseInt(week ?? "0", 10) || 0;

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, slug));

  if (!org) notFound();

  const { weekStart, weekEnd, weekStartStr, weekEndStr } = getWeekBounds(
    org.timezone,
    weekOffset
  );

  const weekAnnouncements = await db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      headerImageUrl: announcements.headerImageUrl,
      displayStartDate: announcements.displayStartDate,
      displayEndDate: announcements.displayEndDate,
    })
    .from(announcements)
    .where(
      and(
        eq(announcements.organizationId, org.id),
        eq(announcements.status, "approved"),
        lte(announcements.displayStartDate, weekEndStr),
        gte(announcements.displayEndDate, weekStartStr)
      )
    );

  const attachments =
    weekAnnouncements.length > 0
      ? await db
          .select()
          .from(announcementAttachments)
          .where(
            inArray(
              announcementAttachments.announcementId,
              weekAnnouncements.map((a) => a.id)
            )
          )
      : [];

  const attsByAnnouncement = attachments.reduce<
    Record<string, typeof attachments>
  >((acc, att) => {
    if (!acc[att.announcementId]) acc[att.announcementId] = [];
    acc[att.announcementId].push(att);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Ward header */}
      <header style={{ backgroundColor: org.primaryColor }} className="text-white">
        {(org as any).bannerUrl && (
          <div className="relative w-full h-48 sm:h-64">
            <Image
              src={(org as any).bannerUrl}
              alt={`${org.name} banner`}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/30" />
          </div>
        )}
        <div className="max-w-3xl mx-auto px-4 py-6 flex items-center gap-4">
          {org.logoUrl && (
            <Image
              src={org.logoUrl}
              alt={`${org.name} logo`}
              width={56}
              height={56}
              className="rounded-full object-cover bg-white/20 shrink-0"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold">{org.name}</h1>
            <p className="text-white/80 text-sm mt-0.5">Weekly Announcements</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Week navigation */}
        <div className="flex items-center justify-between">
          <Link href={`/ward/${slug}?week=${weekOffset - 1}`}>
            <Button variant="outline" size="sm">
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
          </Link>

          <div className="text-center">
            <p className="font-semibold">{weekOffsetLabel(weekOffset)}</p>
            <p className="text-sm text-muted-foreground">
              {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
            </p>
          </div>

          {weekOffset < 0 ? (
            <Link href={`/ward/${slug}?week=${weekOffset + 1}`}>
              <Button variant="outline" size="sm">
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <div className="w-20" />
          )}
        </div>

        {/* Announcements */}
        {weekAnnouncements.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            No announcements for this week.
          </div>
        ) : (
          <div className="space-y-6">
            {weekAnnouncements.map((announcement) => {
              const allAttachments = attsByAnnouncement[announcement.id] ?? [];

              return (
                <article
                  key={announcement.id}
                  className="bg-white rounded-xl border shadow-sm overflow-hidden"
                >
                  {announcement.headerImageUrl && (
                    <div className="relative aspect-video w-full">
                      <Image
                        src={announcement.headerImageUrl}
                        alt={announcement.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="p-6 space-y-4">
                    <h2 className="text-xl font-semibold">{announcement.title}</h2>

                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: announcement.body }}
                    />

                    {allAttachments.length > 0 && (
                      <div className="space-y-1.5 pt-3 border-t">
                        {allAttachments.map((att) => (
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
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <footer className="border-t mt-12 py-6 text-center text-sm text-muted-foreground">
        {org.name} · Powered by Ward Announcements
      </footer>
    </div>
  );
}
