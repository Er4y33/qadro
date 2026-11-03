import type { Sport } from "@/lib/types";

/**
 * Branşa göre saha çizgileri (3:4 oranlı kutunun içine çizilir, vurgu rengini alır).
 * Futbol tam saha, basketbol yarım saha (pota üstte), voleybol filenin bir yanı (file üstte), tenis tam kort.
 */
export function CourtLines({ sport }: { sport: Sport }) {
  return (
    <svg
      viewBox="0 0 100 133.33"
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full text-primary"
      fill="none"
      stroke="currentColor"
      strokeOpacity={0.5}
      strokeWidth={0.7}
      aria-hidden
    >
      {sport === "futbol" && <Football />}
      {sport === "basketbol" && <Basketball />}
      {sport === "voleybol" && <Volleyball />}
      {sport === "tenis" && <Tennis />}
    </svg>
  );
}

function Football() {
  return (
    <>
      <line x1="0" y1="66.67" x2="100" y2="66.67" />
      <circle cx="50" cy="66.67" r="13" />
      <rect x="28" y="-1" width="44" height="19" />
      <rect x="40" y="-1" width="20" height="8" />
      <rect x="28" y="115.33" width="44" height="19" />
      <rect x="40" y="126.33" width="20" height="8" />
    </>
  );
}

function Basketball() {
  return (
    <>
      {/* Boyalı alan ve serbest atış çemberi */}
      <rect x="34" y="-1" width="32" height="41" />
      <circle cx="50" cy="40" r="12" />
      {/* Pota ve panya */}
      <line x1="42" y1="6" x2="58" y2="6" strokeWidth={1.2} />
      <circle cx="50" cy="10" r="3" />
      {/* Üç sayı çizgisi */}
      <path d="M8 -1 L8 23 A44 44 0 0 0 92 23 L92 -1" />
      {/* Orta saha çizgisi ve çember */}
      <line x1="0" y1="132.5" x2="100" y2="132.5" />
      <circle cx="50" cy="133.33" r="13" />
    </>
  );
}

function Volleyball() {
  return (
    <>
      <rect x="6" y="8" width="88" height="118" />
      {/* File */}
      <line x1="0" y1="8" x2="100" y2="8" strokeWidth={2} strokeOpacity={0.8} />
      <circle cx="2" cy="8" r="1.4" fill="currentColor" />
      <circle cx="98" cy="8" r="1.4" fill="currentColor" />
      {/* Hücum çizgisi (fileden 3 m) */}
      <line x1="6" y1="47" x2="94" y2="47" strokeDasharray="2 1.5" />
    </>
  );
}

function Tennis() {
  return (
    <>
      <rect x="6" y="4" width="88" height="125.33" />
      {/* Tekler yan çizgileri */}
      <line x1="17" y1="4" x2="17" y2="129.33" />
      <line x1="83" y1="4" x2="83" y2="129.33" />
      {/* Servis çizgileri ve orta servis çizgisi */}
      <line x1="17" y1="33" x2="83" y2="33" />
      <line x1="17" y1="100.33" x2="83" y2="100.33" />
      <line x1="50" y1="33" x2="50" y2="100.33" />
      <line x1="50" y1="4" x2="50" y2="7" />
      <line x1="50" y1="126.33" x2="50" y2="129.33" />
      {/* File */}
      <line x1="2" y1="66.67" x2="98" y2="66.67" strokeWidth={1.6} strokeOpacity={0.9} />
      <circle cx="2" cy="66.67" r="1.4" fill="currentColor" />
      <circle cx="98" cy="66.67" r="1.4" fill="currentColor" />
    </>
  );
}
