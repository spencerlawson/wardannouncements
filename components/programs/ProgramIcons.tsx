import type { ProgramIconKey } from "@/lib/constants/programs";

interface IconProps {
  className?: string;
}

export function AngelMoroniIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 120 130" fill="currentColor" className={className} aria-hidden="true">
      {/* Wings behind figure */}
      <path d="M44 36 C28 24 18 10 24 2 C28 14 40 26 46 40Z" opacity="0.65" />
      <path d="M42 56 C24 48 14 32 20 20 C26 34 38 48 44 60Z" opacity="0.45" />

      {/* Head — profile oval facing right */}
      <ellipse cx="68" cy="14" rx="9" ry="10" />

      {/* Robe body — profile, right-facing */}
      <path d="M57 26 C63 23 80 26 84 32 C88 44 88 64 85 78 C78 82 62 82 55 78 C49 68 49 48 53 36Z" />

      {/* Robe skirt — sweeps down */}
      <path d="M55 78 C48 92 40 110 37 128 C52 130 74 130 86 128 C88 112 87 95 85 78Z" />

      {/* Arm extended forward toward mouth */}
      <path d="M82 44 Q94 34 104 24" stroke="currentColor" strokeWidth="7" strokeLinecap="round" fill="none" />

      {/* Trumpet tube — from face outward */}
      <line x1="76" y1="17" x2="104" y2="24" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />

      {/* Trumpet bell — at face/mouth */}
      <ellipse cx="75" cy="17" rx="5" ry="3.5" transform="rotate(15 75 17)" />

      {/* Trumpet far end flare */}
      <path d="M102 20 L112 14 L114 20 L106 26Z" />
    </svg>
  );
}

export function TempleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 100 112" fill="currentColor" className={className} aria-hidden="true">
      {/* ── SLC-style east face: 3 spires, center tallest ── */}

      {/* Center spire (tallest) */}
      <polygon points="50,2 56,38 44,38" />
      <rect x="44" y="37" width="12" height="15" />

      {/* Left spire */}
      <polygon points="21,13 27,40 15,40" />
      <rect x="15" y="39" width="12" height="13" />

      {/* Right spire */}
      <polygon points="79,13 85,40 73,40" />
      <rect x="73" y="39" width="12" height="13" />

      {/* Battlements along roofline between spires */}
      <rect x="27" y="44" width="6" height="6" />
      <rect x="35" y="44" width="6" height="6" />
      <rect x="57" y="44" width="6" height="6" />
      <rect x="65" y="44" width="6" height="6" />

      {/* Main building body */}
      <rect x="4" y="50" width="92" height="44" />

      {/* Outer buttresses */}
      <rect x="0" y="54" width="6" height="40" />
      <rect x="94" y="54" width="6" height="40" />

      {/* Large center arch window (white cutout) */}
      <path d="M42 58 L42 90 Q50 94 58 90 L58 58 Q58 50 50 50 Q42 50 42 58Z" fill="white" />

      {/* Side arch windows */}
      <path d="M13 62 L13 86 Q18 88 23 86 L23 62 Q23 57 18 57 Q13 57 13 62Z" fill="white" />
      <path d="M77 62 L77 86 Q82 88 87 86 L87 62 Q87 57 82 57 Q77 57 77 62Z" fill="white" />

      {/* Steps */}
      <rect x="2" y="94" width="96" height="5" />
      <rect x="0" y="99" width="100" height="7" />

      {/* Angel Moroni on center spire */}
      <circle cx="50" cy="1.5" r="2" />
    </svg>
  );
}

export function CTRIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 100 110" fill="none" className={className} aria-hidden="true">
      {/* Shield shape */}
      <path
        d="M8 8 H92 V62 Q92 90 50 104 Q8 90 8 62 Z"
        fill="currentColor"
      />
      {/* Inner shield border */}
      <path
        d="M14 14 H86 V62 Q86 84 50 97 Q14 84 14 62 Z"
        fill="none"
        stroke="white"
        strokeWidth="2"
      />
      {/* C */}
      <path
        d="M20 42 Q20 30 30 30 L38 30 L38 36 L30 36 Q26 36 26 42 Q26 48 30 48 L38 48 L38 54 L30 54 Q20 54 20 42Z"
        fill="white"
      />
      {/* T */}
      <rect x="42" y="30" width="16" height="6" fill="white" />
      <rect x="47" y="36" width="6" height="18" fill="white" />
      {/* R */}
      <rect x="62" y="30" width="6" height="24" fill="white" />
      <path d="M68 30 Q80 30 80 38 Q80 44 74 46 L80 54 L74 54 L68 46 L68 54 L62 54 L62 30 Z" fill="white" />
      <path d="M68 36 L72 36 Q74 36 74 39 Q74 42 72 42 L68 42 Z" fill="currentColor" />
    </svg>
  );
}

export function ProgramIcon({ icon, className }: { icon: string | null; className?: string }) {
  if (icon === "angel_moroni") return <AngelMoroniIcon className={className} />;
  if (icon === "temple") return <TempleIcon className={className} />;
  if (icon === "ctr") return <CTRIcon className={className} />;
  return null;
}
