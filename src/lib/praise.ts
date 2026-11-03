import type { Sport } from "./types";

/**
 * Övgüler: Oyuncuların maç sonunda birbirine verdiği etiketler.
 *
 * Başarımlardan (src/lib/badges.ts) farkı:
 * - Başarımı sistem verir, oyuncu kendi davranışıyla kazanır.
 * - Övgüyü takım arkadaşı verir. Sosyal tanınma sağlar (Malone ve Lepper: "recognition").
 * Övgüler oyuncu kartında sayılarıyla görünür ama XP vermez.
 */
export interface Praise {
  id: string;
  label: string;
  emoji: string;
  /** Radar grafiğinde bu övgünün beslediği eksen */
  axis: string;
}

const CENTILMEN: Praise = { id: "centilmen", label: "Centilmen", emoji: "🤝", axis: "Fair Play" };

/**
 * Branşa özel övgüler (Melih'in Kasım 2026 tasarımı). Centilmenlik her branşta ortaktır.
 * Kimlikler veritabanında saklanır; futbolun eski kimlikleri (dinamik, kaya-gibi, taktiksel) korunmuştur.
 */
export const SPORT_PRAISES: Record<Sport, Praise[]> = {
  futbol: [
    CENTILMEN,
    { id: "dinamik", label: "Dinamik", emoji: "⚡", axis: "Hız" },
    { id: "kaya-gibi", label: "Kaya Gibi", emoji: "🧱", axis: "Savunma" },
    { id: "taktiksel", label: "Taktiksel", emoji: "🧠", axis: "Taktik" },
  ],
  basketbol: [
    CENTILMEN,
    { id: "keskin-sutor", label: "Keskin Şutör", emoji: "🎯", axis: "Şut" },
    { id: "oyun-kurucu", label: "Oyun Kurucu", emoji: "🧠", axis: "Asist" },
    { id: "ribaund-canavari", label: "Ribaund Canavarı", emoji: "🧱", axis: "Ribaund" },
  ],
  voleybol: [
    CENTILMEN,
    { id: "smac-ustasi", label: "Smaç Ustası", emoji: "💥", axis: "Smaç" },
    { id: "blok-duvari", label: "Blok Duvarı", emoji: "🧱", axis: "Blok" },
    { id: "altin-pas", label: "Altın Pas", emoji: "🎯", axis: "Pas" },
  ],
  tenis: [
    CENTILMEN,
    { id: "servis-canavari", label: "Servis Canavarı", emoji: "🚀", axis: "Servis" },
    { id: "file-ustasi", label: "File Ustası", emoji: "🎾", axis: "Vole" },
    { id: "yorulmaz", label: "Yorulmaz", emoji: "🔋", axis: "Kondisyon" },
  ],
};

/** Futbol övgüleri (eski kullanım için) */
export const PRAISES = SPORT_PRAISES.futbol;

/** Bütün branşların övgüleri, her kimlik bir kez */
export const ALL_PRAISES: Praise[] = [...new Map(Object.values(SPORT_PRAISES).flat().map((p) => [p.id, p])).values()];

export const praisesFor = (sport: Sport): Praise[] => SPORT_PRAISES[sport];
export const praiseById = (id: string): Praise | undefined => ALL_PRAISES.find((p) => p.id === id);

/** Kısa mevki etiketlerinin değerlendirme ekranındaki açık hali */
export const POSITION_NAMES: Record<string, string> = {
  Snt: "Forvet",
  SolO: "Orta Saha (Sol)",
  SağO: "Orta Saha (Sağ)",
  Stp: "Defans",
  Klc: "Kaleci",
  OS: "Orta Saha",
  SolB: "Sol Bek",
  SağB: "Sağ Bek",
  Lib: "Libero",
  // Basketbol
  Pvt: "Pivot",
  UF: "Uzun Forvet",
  Şut: "Şutör",
  Knt: "Kanat",
  OK: "Oyun Kurucu",
  // Voleybol
  Smç: "Smaçör",
  Ort: "Orta Oyuncu",
  Çpr: "Pasör Çaprazı",
  SmçA: "Arka Smaçör",
  Pas: "Pasör",
  // Tenis
  Kort: "Kort",
};
