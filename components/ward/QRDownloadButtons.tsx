"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QrCode, Download, FileText, ChevronDown, Loader2 } from "lucide-react";

interface Props {
  orgId: string;
  wardSlug: string;
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildMarketingHTML(
  wardName: string,
  wardUrl: string,
  qrDataUrl: string,
  primaryColor: string
): string {
  const safe = escapeHtml(wardName);
  const color = primaryColor || "#1a365d";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${safe} — Ward Announcements</title>
  <style>
    @page { size: letter portrait; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 8.5in;
      height: 11in;
      font-family: Georgia, 'Times New Roman', serif;
      background: white;
      color: #1c1917;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .top-bar {
      width: 100%;
      height: 0.55in;
      background: ${color};
      flex-shrink: 0;
    }
    .content {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 0.4in 1in 0.3in;
      text-align: center;
      gap: 0;
    }
    .ward-name {
      font-size: 30pt;
      font-weight: bold;
      color: ${color};
      letter-spacing: 0.01em;
      line-height: 1.15;
      margin-bottom: 0.12in;
    }
    .tagline {
      font-size: 14pt;
      color: #57534e;
      font-style: italic;
      margin-bottom: 0.35in;
    }
    .qr-wrap {
      border: 2pt solid ${color};
      padding: 14pt;
      border-radius: 10pt;
      margin-bottom: 0.18in;
      display: inline-block;
      background: white;
    }
    .qr-wrap img {
      width: 3in;
      height: 3in;
      display: block;
    }
    .ward-url {
      font-size: 10.5pt;
      color: #78716c;
      letter-spacing: 0.03em;
      margin-bottom: 0.42in;
    }
    .bullets-box {
      border: 1.5pt solid ${color};
      border-radius: 8pt;
      padding: 0.25in 0.38in;
      width: 5.4in;
      text-align: left;
    }
    .bullets-heading {
      font-size: 10pt;
      font-weight: bold;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: ${color};
      margin-bottom: 0.14in;
    }
    .bullet {
      display: flex;
      align-items: flex-start;
      gap: 10pt;
      padding: 4.5pt 0;
      font-size: 12pt;
      color: #1c1917;
      line-height: 1.35;
    }
    .check {
      color: ${color};
      font-weight: bold;
      font-size: 13pt;
      flex-shrink: 0;
      margin-top: 0.5pt;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="top-bar"></div>
    <div class="content">
      <div class="ward-name">${safe}</div>
      <div class="tagline">Stay connected with your ward community</div>

      <div class="qr-wrap">
        <img src="${qrDataUrl}" alt="QR Code" />
      </div>
      <div class="ward-url">${escapeHtml(wardUrl)}</div>

      <div class="bullets-box">
        <div class="bullets-heading">Scan to access</div>
        <div class="bullet"><span class="check">✓</span><span>Weekly announcements from your bishopric and ward leadership</span></div>
        <div class="bullet"><span class="check">✓</span><span>Meeting programs — sacrament meeting, baptisms, and more</span></div>
        <div class="bullet"><span class="check">✓</span><span>Always current — updated in real time throughout the week</span></div>
        <div class="bullet"><span class="check">✓</span><span>Works on any smartphone or device — no app required</span></div>
        <div class="bullet"><span class="check">✓</span><span>Free and accessible to members, families, and visitors alike</span></div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export default function QRDownloadButtons({ orgId, wardSlug }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleMarketingSheet() {
    setLoading(true);
    try {
      const res = await fetch(`/api/qrcode/${orgId}?format=dataurl`);
      if (!res.ok) return;
      const { dataUrl, wardUrl, wardName, primaryColor } = await res.json();
      const html = buildMarketingHTML(wardName, wardUrl, dataUrl, primaryColor);
      const win = window.open("", "_blank", "width=900,height=700");
      if (!win) return;
      win.document.open();
      win.document.write(html);
      win.document.close();
      win.addEventListener("load", () => {
        win.focus();
        win.print();
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5">
            <QrCode className="h-4 w-4" />
            QR Code
            <ChevronDown className="h-3 w-3 opacity-60" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          render={
            <a
              href={`/api/qrcode/${orgId}`}
              download={`${wardSlug}-qrcode.png`}
            />
          }
        >
          <Download className="h-4 w-4" />
          Raw QR Code (PNG)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleMarketingSheet} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          {loading ? "Generating…" : "Marketing Sheet (PDF)"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
