import type { Sport } from "./types";

/*
 * Branşa özel saha dizilimleri (Melih'in Kasım 2026 tasarımı).
 * - Futbol: tam saha, mevkiye göre bölge seçimi
 * - Basketbol: yarım saha (Pivot, Uzun Forvet, Şutör, Kanat, Oyun Kurucu)
 * - Voleybol: filenin bir yanı, ön ve arka hat (Smaçör, Orta Oyuncu, Pasör, Libero…)
 * - Tenis: tam kort; tekler "Rakip Olarak Katıl", çiftlerde boş yerin tarafına göre Rakip ya da Partner
 * Koordinatlar sahanın yüzdesidir (x soldan, y yukarıdan). Kısa kod veritabanına "position" olarak yazılır (en fazla 8 karakter).
 */
export interface Zone {
  id: string;
  label: string;
  short: string;
  x: number;
  y: number;
}

const FOOTBALL: Zone[] = [
  { id: "orta-saha", label: "Orta Saha", short: "OS", x: 50, y: 50 },
  { id: "sol-bek", label: "Sol Bek", short: "SolB", x: 16, y: 52 },
  { id: "sag-bek", label: "Sağ Bek", short: "SağB", x: 84, y: 52 },
  { id: "libero", label: "Libero", short: "Lib", x: 50, y: 74 },
];

const BASKETBALL: Zone[] = [
  { id: "pivot", label: "Pivot", short: "Pvt", x: 35, y: 30 },
  { id: "uzun-forvet", label: "Uzun Forvet", short: "UF", x: 66, y: 30 },
  { id: "sutor", label: "Şutör", short: "Şut", x: 17, y: 60 },
  { id: "kanat", label: "Kanat", short: "Knt", x: 83, y: 60 },
  { id: "oyun-kurucu", label: "Oyun Kurucu", short: "OK", x: 50, y: 82 },
];

const VOLLEYBALL: Zone[] = [
  { id: "smacor", label: "Smaçör", short: "Smç", x: 20, y: 26 },
  { id: "orta-oyuncu", label: "Orta Oyuncu", short: "Ort", x: 50, y: 26 },
  { id: "pasor-caprazi", label: "Pasör Çaprazı", short: "Çpr", x: 80, y: 26 },
  { id: "smacor-arka", label: "Arka Smaçör", short: "SmçA", x: 20, y: 72 },
  { id: "libero", label: "Libero", short: "Lib", x: 50, y: 76 },
  { id: "pasor", label: "Pasör", short: "Pas", x: 80, y: 72 },
];

const TENNIS_SINGLES: Zone[] = [
  { id: "ust", label: "Kort (Üst)", short: "Kort", x: 50, y: 20 },
  { id: "alt", label: "Kort (Alt)", short: "Kort", x: 50, y: 80 },
];

const TENNIS_DOUBLES: Zone[] = [
  { id: "ust-sol", label: "Kort (Üst Sol)", short: "Kort", x: 28, y: 20 },
  { id: "ust-sag", label: "Kort (Üst Sağ)", short: "Kort", x: 72, y: 20 },
  { id: "alt-sol", label: "Kort (Alt Sol)", short: "Kort", x: 28, y: 80 },
  { id: "alt-sag", label: "Kort (Alt Sağ)", short: "Kort", x: 72, y: 80 },
];

export function zonesFor(sport: Sport, format: string): Zone[] {
  switch (sport) {
    case "basketbol":
      return BASKETBALL;
    case "voleybol":
      return VOLLEYBALL;
    case "tenis":
      return format === "Tekler" ? TENNIS_SINGLES : TENNIS_DOUBLES;
    default:
      return FOOTBALL;
  }
}

/** Bir bölge sahada duran bir oyuncunun yerine denk geliyorsa doludur */
export function isTaken(zone: { x: number; y: number }, lineup: { x: number; y: number }[]): boolean {
  return lineup.some((s) => Math.abs(s.x - zone.x) < 8 && Math.abs(s.y - zone.y) < 8);
}

/** Tenis kortunda file ortadadır: üst yarı ve alt yarı iki ayrı taraftır */
export const courtSide = (y: number): "ust" | "alt" => (y < 50 ? "ust" : "alt");

/**
 * Tenis kortundaki bir yerin izleyiciye göre rolü.
 * Referans taraf: izleyici kadrodaysa kendi tarafı, değilse organizatörün (ilk katılanın) tarafı.
 * Aynı taraf → Partner (çiftler), karşı taraf → Rakip.
 */
export function tennisRole(y: number, referenceY: number | undefined): "Rakip" | "Partner" {
  if (referenceY === undefined) return "Rakip";
  return courtSide(y) === courtSide(referenceY) ? "Partner" : "Rakip";
}

export const COURT_TITLE: Record<Sport, string> = {
  futbol: "Saha Dizilimi",
  basketbol: "Saha Dizilimi",
  voleybol: "Saha Dizilimi",
  tenis: "Kort Dizilimi",
};
