"use client";

import { useState, useEffect } from "react";
import { Cookie } from "lucide-react";

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

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = getCookie("cookie_consent");
    if (!consent) setVisible(true);
  }, []);

  if (!visible) return null;

  const accept = () => {
    setCookie("cookie_consent", "accepted", 60 * 60 * 24 * 365);
    setVisible(false);
  };

  const decline = () => {
    setCookie("cookie_consent", "declined", 60 * 60 * 24 * 365);
    setVisible(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 flex justify-center">
      <div className="bg-white border shadow-lg rounded-xl max-w-lg w-full flex items-start gap-3 p-4">
        <Cookie className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground font-medium">Cookies</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            We use cookies to remember which organizations you&apos;re interested in so your filter preferences persist between visits.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={decline}
            className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded transition-colors"
          >
            No thanks
          </button>
          <button
            type="button"
            onClick={accept}
            className="text-xs font-medium bg-foreground text-background px-3 py-1.5 rounded-lg hover:bg-foreground/90 transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
