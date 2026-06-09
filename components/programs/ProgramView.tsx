"use client";

import { format, parseISO } from "date-fns";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PROGRAM_TYPE_LABELS } from "@/lib/constants/programs";
import { ProgramIcon } from "./ProgramIcons";
import type { Program, ProgramItem } from "@/lib/db/schema";

interface ProgramViewProps {
  program: Program;
  items: ProgramItem[];
  wardName: string;
  primaryColor?: string;
  showPrintButton?: boolean;
}

// ── Print window generator ────────────────────────────────────────────────────

function itemToHTML(item: ProgramItem): string {
  if (item.type === "divider") {
    return `<hr style="border:none;border-top:1px solid #d6d3d1;margin:8pt 0;">`;
  }

  if (item.type === "sacrament") {
    return `
      <div style="text-align:center;padding:4pt 0;">
        <span style="font-size:9pt;font-weight:bold;letter-spacing:0.12em;text-transform:uppercase;color:#57534e;">
          ${item.label || "Administration of the Sacrament"}
        </span>
      </div>`;
  }

  if (item.type === "hymn") {
    const detail = item.detail ? ` &mdash; ${item.detail}` : "";
    const cong = item.isCongregalional ? ` <span style="font-size:8pt;color:#a8a29e;">(Congregation)</span>` : "";
    return `
      <div style="text-align:center;padding:4pt 0;">
        <span style="font-weight:bold;">${item.label || "Hymn"}</span>
        <span style="color:#57534e;">${detail}</span>${cong}
      </div>`;
  }

  if (item.type === "prayer") {
    const detail = item.detail ? `<span style="font-weight:bold;float:right;">${item.detail}</span>` : "";
    return `
      <div style="padding:2pt 0;overflow:hidden;">
        <span style="color:#78716c;">${item.label || "Prayer"}</span>
        ${detail}
        <div style="clear:both;"></div>
      </div>`;
  }

  if (item.type === "speaker" || item.type === "musical_number") {
    const name = item.detail ? `<div style="font-weight:bold;">${item.detail}</div>` : "";
    const sub = item.secondaryDetail ? `<div style="font-style:italic;color:#78716c;font-size:10pt;">${item.secondaryDetail}</div>` : "";
    return `
      <div style="padding:2pt 0;display:flex;justify-content:space-between;align-items:flex-start;gap:12pt;">
        <span style="color:#78716c;white-space:nowrap;">${item.label || "Speaker"}</span>
        <div style="text-align:right;">${name}${sub}</div>
      </div>`;
  }

  if (item.type === "scripture") {
    const label = item.label ? `<div style="font-size:8pt;text-transform:uppercase;letter-spacing:0.1em;color:#a8a29e;">${item.label}</div>` : "";
    const ref = item.detail ? `<div style="font-weight:bold;">${item.detail}</div>` : "";
    const verse = item.secondaryDetail ? `<div style="font-style:italic;color:#78716c;">${item.secondaryDetail}</div>` : "";
    return `<div style="padding:4pt 0;">${label}${ref}${verse}</div>`;
  }

  // text
  const detail = item.detail ? `<span style="font-weight:500;float:right;">${item.detail}</span>` : "";
  return `
    <div style="padding:2pt 0;overflow:hidden;">
      <span style="color:#78716c;">${item.label || ""}</span>
      ${detail}
      <div style="clear:both;"></div>
    </div>`;
}

function buildPrintHTML(
  program: Program,
  items: ProgramItem[],
  wardName: string
): string {
  const typeLabel = PROGRAM_TYPE_LABELS[program.type];
  const displayTitle = program.title || typeLabel;
  const dateStr = format(parseISO(program.date), "EEEE, MMMM d, yyyy");
  const sessionLine = program.sessionLabel
    ? `<div style="font-size:11pt;color:#57534e;margin-top:3pt;">${program.sessionLabel}</div>`
    : "";
  const themeLine = program.theme
    ? `<div style="font-size:10pt;font-style:italic;color:#57534e;margin-top:6pt;">&ldquo;${program.theme}&rdquo;</div>`
    : "";

  const itemsHTML = items.map(itemToHTML).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${wardName} &mdash; ${displayTitle}</title>
  <style>
    @page {
      size: letter portrait;
      margin: 0.65in 0.75in;
    }
    * { box-sizing: border-box; }
    body {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 10pt;
      color: #1c1917;
      margin: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header {
      text-align: center;
      margin-bottom: 12pt;
      padding-bottom: 10pt;
      border-bottom: 1.5pt solid #1c1917;
    }
    .ward-name {
      font-size: 7pt;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: #78716c;
      margin: 0 0 3pt;
    }
    .meeting-title {
      font-size: 20pt;
      font-weight: bold;
      margin: 0 0 3pt;
      line-height: 1.2;
    }
    .meeting-date {
      font-size: 10pt;
      color: #44403c;
      margin: 3pt 0 0;
    }
    .item { break-inside: avoid; }
  </style>
</head>
<body>
  <div class="header">
    <p class="ward-name">${wardName}</p>
    <h1 class="meeting-title">${displayTitle}</h1>
    ${sessionLine}
    <p class="meeting-date">${dateStr}</p>
    ${themeLine}
  </div>
  <div>
    ${items.map((item) => `<div class="item">${itemToHTML(item)}</div>`).join("\n")}
  </div>
</body>
</html>`;
}

function handlePrint(program: Program, items: ProgramItem[], wardName: string) {
  const html = buildPrintHTML(program, items, wardName);
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.addEventListener("load", () => {
    win.focus();
    win.print();
  });
}

// ── Screen row renderers ──────────────────────────────────────────────────────

function ItemRow({ item }: { item: ProgramItem }) {
  if (item.type === "divider") {
    return <hr className="border-t border-stone-200 my-3" />;
  }

  if (item.type === "sacrament") {
    return (
      <div className="py-2 text-center">
        <span className="text-sm font-semibold tracking-wide uppercase text-stone-500">
          {item.label || "Administration of the Sacrament"}
        </span>
      </div>
    );
  }

  if (item.type === "scripture") {
    return (
      <div className="py-2 space-y-0.5">
        {item.label && (
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">{item.label}</p>
        )}
        {item.detail && <p className="text-sm font-semibold text-stone-700">{item.detail}</p>}
        {item.secondaryDetail && <p className="text-sm italic text-stone-500">{item.secondaryDetail}</p>}
      </div>
    );
  }

  if (item.type === "hymn") {
    return (
      <div className="py-1.5 text-center">
        <span className="text-sm font-medium text-stone-700">{item.label || "Hymn"}</span>
        {item.detail && <span className="text-sm text-stone-500"> — {item.detail}</span>}
        {item.isCongregalional && (
          <span className="ml-1.5 text-[11px] text-stone-400">(Congregation)</span>
        )}
      </div>
    );
  }

  if (item.type === "speaker" || item.type === "musical_number") {
    return (
      <div className="flex items-start justify-between gap-4 py-1.5">
        <span className="text-sm font-medium text-stone-500 shrink-0">
          {item.label || (item.type === "speaker" ? "Speaker" : "Musical Number")}
        </span>
        <div className="text-right min-w-0">
          {item.detail && <p className="text-sm font-semibold text-stone-800">{item.detail}</p>}
          {item.secondaryDetail && <p className="text-sm italic text-stone-500">{item.secondaryDetail}</p>}
        </div>
      </div>
    );
  }

  if (item.type === "prayer") {
    return (
      <div className="flex items-baseline justify-between gap-4 py-1.5">
        <span className="text-sm font-medium text-stone-500 shrink-0">{item.label || "Prayer"}</span>
        {item.detail && <span className="text-sm font-semibold text-stone-800">{item.detail}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <span className="text-sm text-stone-500">{item.label}</span>
      {item.detail && <span className="text-sm font-medium text-stone-700">{item.detail}</span>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProgramView({
  program,
  items,
  wardName,
  primaryColor = "#1a365d",
  showPrintButton = true,
}: ProgramViewProps) {
  const typeLabel = PROGRAM_TYPE_LABELS[program.type];
  const dateStr = format(parseISO(program.date), "EEEE, MMMM d, yyyy");
  const displayTitle = program.title || typeLabel;

  return (
    <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
      <div className="h-1.5 w-full" style={{ backgroundColor: primaryColor }} />

      <div className="px-6 pt-5 pb-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">{wardName}</p>
            <h2 className="text-xl font-bold text-stone-900 font-serif">{displayTitle}</h2>
            {program.sessionLabel && <p className="text-sm text-stone-500">{program.sessionLabel}</p>}
            <p className="text-sm text-stone-500">{dateStr}</p>
            {program.theme && <p className="text-sm italic text-stone-500 pt-1">"{program.theme}"</p>}
          </div>
          {program.icon && (
            <ProgramIcon icon={program.icon} className="h-16 w-16 shrink-0 text-stone-300" />
          )}
        </div>

        <hr className="border-stone-200" />

        <div className="space-y-0.5">
          {items.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </div>
      </div>

      {showPrintButton && (
        <div className="border-t border-stone-100 px-6 py-3 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-stone-500 hover:text-stone-800"
            onClick={() => handlePrint(program, items, wardName)}
          >
            <Printer className="h-4 w-4" />
            Print / Save PDF
          </Button>
        </div>
      )}
    </div>
  );
}
