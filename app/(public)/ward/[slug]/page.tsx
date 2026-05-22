import { db } from "@/lib/db";
import { organizations, announcements, announcementAttachments, announcementAuxiliaries } from "@/lib/db/schema";
import { eq, and, lte, gte, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getWeekBounds, weekOffsetLabel } from "@/lib/utils/weeks";
import Image from "next/image";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Metadata } from "next";
import AuxiliaryFilter from "@/components/public/AuxiliaryFilter";
import CookieConsentBanner from "@/components/public/CookieConsentBanner";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [org] = await db
    .select({ name: organizations.name, logoUrl: organizations.logoUrl })
    .from(organizations)
    .where(eq(organizations.slug, slug));

  if (!org) return {};

  return {
    title: `${org.name} — Announcements`,
    ...(org.logoUrl && {
      icons: { icon: org.logoUrl, apple: org.logoUrl },
    }),
  };
}

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
      isPinned: announcements.isPinned,
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

  const announcementIds = weekAnnouncements.map((a) => a.id);

  const [attachments, auxRows] =
    announcementIds.length > 0
      ? await Promise.all([
          db
            .select()
            .from(announcementAttachments)
            .where(inArray(announcementAttachments.announcementId, announcementIds)),
          db
            .select()
            .from(announcementAuxiliaries)
            .where(inArray(announcementAuxiliaries.announcementId, announcementIds)),
        ])
      : [[], []];

  const attsByAnnouncement = attachments.reduce<Record<string, typeof attachments>>(
    (acc, att) => {
      if (!acc[att.announcementId]) acc[att.announcementId] = [];
      acc[att.announcementId].push(att);
      return acc;
    },
    {}
  );

  const auxByAnnouncement = auxRows.reduce<Record<string, string[]>>(
    (acc, row) => {
      if (!acc[row.announcementId]) acc[row.announcementId] = [];
      acc[row.announcementId].push(row.auxiliary);
      return acc;
    },
    {}
  );

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
        <div className="max-w-3xl mx-auto px-4 py-2 flex items-center gap-4">
          {org.logoUrl && (
            <Image
              src={org.logoUrl}
              alt={`${org.name} logo`}
              width={105}
              height={105}
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

        {/* Announcements with auxiliary filtering */}
        <AuxiliaryFilter
          announcements={weekAnnouncements.map((a) => ({
            ...a,
            auxiliaries: auxByAnnouncement[a.id] ?? [],
            attachments: attsByAnnouncement[a.id] ?? [],
          }))}
          wardSlug={slug}
          primaryColor={org.primaryColor}
        />
      </main>

      <footer className="border-t mt-12 py-6 text-center text-sm text-muted-foreground">
        {org.name} · Powered by Ward Announcements
      </footer>

      <CookieConsentBanner />
    </div>
  );
}
