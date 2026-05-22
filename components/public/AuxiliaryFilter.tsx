"use client";

import { useState, useEffect } from "react";
import { AUXILIARY_COLORS } from "@/lib/constants/auxiliaries";
import Image from "next/image";
import { format } from "date-fns";
import { Paperclip, Pin } from "lucide-react";

interface Attachment {
  id: string;
  fileUrl: string;
  fileName: string;
  fileType: "image" | "document";
  fileSize: number;
}

export interface AnnouncementWithExtras {
  id: string;
  title: string;
  body: string;
  headerImageUrl: string | null;
  displayStartDate: string;
  displayEndDate: string;
  isPinned: boolean;
  auxiliaries: string[];
  attachments: Attachment[];
}

interface Props {
  announcements: AnnouncementWithExtras[];
  wardSlug: string;
  primaryColor: string;
}

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="));
  return match ? decodeURIComponent(match.split("=")[1]) : undefined;
}

function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export default function AuxiliaryFilter({ announcements, wardSlug, primaryColor }: Props) {
  const cookieKey = `ward_aux_${wardSlug}`;
  const [selected, setSelected] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Read saved preferences on mount
  useEffect(() => {
    const consent = getCookie("cookie_consent");
    if (consent === "accepted") {
      const saved = getCookie(cookieKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setSelected(parsed);
        } catch {
          // ignore malformed cookie
        }
      }
    }
    setHydrated(true);
  }, [cookieKey]);

  // Save preference whenever selection changes
  useEffect(() => {
    if (!hydrated) return;
    const consent = getCookie("cookie_consent");
    if (consent === "accepted") {
      setCookie(cookieKey, JSON.stringify(selected), 60 * 60 * 24 * 365);
    }
  }, [selected, cookieKey, hydrated]);

  const toggleAux = (aux: string) => {
    setSelected((prev) =>
      prev.includes(aux) ? prev.filter((a) => a !== aux) : [...prev, aux]
    );
  };

  // Collect all auxiliaries that appear in at least one announcement
  const availableAuxes = Array.from(
    new Set(announcements.flatMap((a) => a.auxiliaries))
  ).sort();

  // Sort announcements:
  // Group 1: pinned (always first)
  // Group 2: has ≥1 selected auxiliary (when filter is active)
  // Group 3: everything else
  const sorted = [...announcements].sort((a, b) => {
    const aPinned = a.isPinned ? 0 : 1;
    const bPinned = b.isPinned ? 0 : 1;
    if (aPinned !== bPinned) return aPinned - bPinned;

    if (selected.length > 0) {
      const aMatch = a.auxiliaries.some((x) => selected.includes(x)) ? 0 : 1;
      const bMatch = b.auxiliaries.some((x) => selected.includes(x)) ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
    }

    return 0; // preserve original order within groups
  });

  return (
    <div className="space-y-6">
      {/* Filter pills */}
      {availableAuxes.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Filter by organization
          </p>
          <div className="flex flex-wrap gap-2">
            {availableAuxes.map((aux) => {
              const active = selected.includes(aux);
              const color = AUXILIARY_COLORS[aux] ?? "#64748b";
              return (
                <button
                  key={aux}
                  type="button"
                  onClick={() => toggleAux(aux)}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-all border"
                  style={
                    active
                      ? { backgroundColor: color, borderColor: color, color: "#fff" }
                      : { backgroundColor: "transparent", borderColor: color, color: color }
                  }
                >
                  {aux}
                </button>
              );
            })}
            {selected.length > 0 && (
              <button
                type="button"
                onClick={() => setSelected([])}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border border-muted-foreground/30 text-muted-foreground hover:bg-muted/40 transition-all"
              >
                Clear
              </button>
            )}
          </div>
          {selected.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Showing announcements for selected organizations first.
            </p>
          )}
        </div>
      )}

      {/* Announcements */}
      {sorted.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No announcements for this week.
        </div>
      ) : (
        <div className="space-y-6">
          {sorted.map((announcement) => (
            <article
              key={announcement.id}
              className="bg-white rounded-xl border shadow-sm overflow-hidden"
            >
              {announcement.isPinned && (
                <div
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold"
                  style={{ backgroundColor: primaryColor, color: "#fff" }}
                >
                  <Pin className="h-3 w-3" />
                  Important Announcement
                </div>
              )}

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
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">{announcement.title}</h2>
                  {announcement.auxiliaries.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {announcement.auxiliaries.map((aux) => {
                        const color = AUXILIARY_COLORS[aux] ?? "#64748b";
                        return (
                          <span
                            key={aux}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ backgroundColor: `${color}20`, color: color, border: `1px solid ${color}40` }}
                          >
                            {aux}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: announcement.body }}
                />

                {announcement.attachments.length > 0 && (
                  <div className="space-y-1.5 pt-3 border-t">
                    {announcement.attachments.map((att) => (
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
          ))}
        </div>
      )}
    </div>
  );
}
