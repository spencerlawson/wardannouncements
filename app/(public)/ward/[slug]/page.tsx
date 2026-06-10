import { db } from "@/lib/db";
import { organizations, announcements, announcementAttachments, announcementAuxiliaries, programs, programItems } from "@/lib/db/schema";
import { eq, and, lte, gte, inArray, between, asc } from "drizzle-orm";
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
import ProgramView from "@/components/programs/ProgramView";
import { PROGRAM_TYPE_LABELS } from "@/lib/constants/programs";

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
  searchParams: Promise<{ week?: string; tab?: string; program?: string }>;
}) {
  const { slug } = await params;
  const { week, tab, program: programParam } = await searchParams;
  const weekOffset = parseInt(week ?? "0", 10) || 0;
  const activeTab = tab === "programs" ? "programs" : "announcements";

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

  // Fetch published, active programs for the week
  const weekPrograms = await db
    .select()
    .from(programs)
    .where(
      and(
        eq(programs.organizationId, org.id),
        eq(programs.status, "published"),
        eq(programs.isActive, true),
        between(programs.date, weekStartStr, weekEndStr)
      )
    )
    .orderBy(asc(programs.date), asc(programs.createdAt));

  const programIds = weekPrograms.map((p) => p.id);
  const allProgramItems =
    programIds.length > 0
      ? await db
          .select()
          .from(programItems)
          .where(inArray(programItems.programId, programIds))
          .orderBy(asc(programItems.sortOrder))
      : [];

  const itemsByProgram = allProgramItems.reduce<Record<string, typeof allProgramItems>>(
    (acc, item) => {
      if (!acc[item.programId]) acc[item.programId] = [];
      acc[item.programId].push(item);
      return acc;
    },
    {}
  );

  const hasPrograms = weekPrograms.length > 0;
  const selectedProgram =
    weekPrograms.find((p) => p.id === programParam) ?? weekPrograms[0];

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

        {/* Tab switcher — only shown when programs exist for this week */}
        {hasPrograms && (
          <div className="flex gap-1 border-b">
            <Link
              href={`/ward/${slug}?week=${weekOffset}`}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === "announcements"
                  ? "border-current text-stone-900"
                  : "border-transparent text-stone-500 hover:text-stone-700"
              }`}
              style={activeTab === "announcements" ? { borderColor: org.primaryColor } : undefined}
            >
              Announcements
            </Link>
            <Link
              href={`/ward/${slug}?week=${weekOffset}&tab=programs`}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === "programs"
                  ? "border-current text-stone-900"
                  : "border-transparent text-stone-500 hover:text-stone-700"
              }`}
              style={activeTab === "programs" ? { borderColor: org.primaryColor } : undefined}
            >
              Programs
              <span className="ml-1.5 text-xs bg-stone-100 text-stone-600 rounded-full px-1.5 py-0.5">
                {weekPrograms.length}
              </span>
            </Link>
          </div>
        )}

        {/* Announcements tab */}
        {activeTab === "announcements" && (
          <AuxiliaryFilter
            announcements={weekAnnouncements.map((a) => ({
              ...a,
              auxiliaries: auxByAnnouncement[a.id] ?? [],
              attachments: attsByAnnouncement[a.id] ?? [],
            }))}
            wardSlug={slug}
            primaryColor={org.primaryColor}
          />
        )}

        {/* Programs tab */}
        {activeTab === "programs" && selectedProgram && (
          <div className="space-y-4">
            {weekPrograms.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {weekPrograms.map((program) => {
                  const label = program.title || PROGRAM_TYPE_LABELS[program.type];
                  const isSelected = program.id === selectedProgram.id;
                  return (
                    <Link
                      key={program.id}
                      href={`/ward/${slug}?week=${weekOffset}&tab=programs&program=${program.id}`}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-all border"
                      style={
                        isSelected
                          ? { backgroundColor: org.primaryColor, borderColor: org.primaryColor, color: "#fff" }
                          : { backgroundColor: "transparent", borderColor: org.primaryColor, color: org.primaryColor }
                      }
                    >
                      {label}
                      {program.sessionLabel && ` · ${program.sessionLabel}`}
                    </Link>
                  );
                })}
              </div>
            )}

            <ProgramView
              program={selectedProgram}
              items={itemsByProgram[selectedProgram.id] ?? []}
              wardName={org.name}
              primaryColor={org.primaryColor}
            />
          </div>
        )}
      </main>

      <footer className="border-t mt-12 py-6 text-center text-sm text-muted-foreground">
        {org.name} · Powered by Ward Announcements
      </footer>

      <CookieConsentBanner />
    </div>
  );
}
