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
  /** Radar grafiğinde bu övgünün beslediği eksen (Centilmen'de yok) */
  axis?: string;
}

/** Centilmenlik her branşta ortaktır; bir beceri değil, tutumdur: radar grafiğinde ekseni yoktur */
const CENTILMEN: Praise = { id: "centilmen", label: "Centilmen", emoji: "🤝" };

/**
 * Branşa özel övgüler (Melih'in Kasım 2026 tasarımı ve ekip kararı).
 * Her branşın 6 beceri övgüsü radar grafiğinin 6 eksenini besler (altıgen); Centilmen ortaktır.
 * Kimlikler veritabanında saklanır; futbolun eski kimlikleri (dinamik, kaya-gibi, taktiksel) korunmuştur.
 */
export const SPORT_PRAISES: Record<Sport, Praise[]> = {
  futbol: [
    CENTILMEN,
    { id: "dinamik", label: "Dinamik", emoji: "⚡", axis: "Hız" },
    { id: "refleks-ustasi", label: "Refleks Ustası", emoji: "🧤", axis: "Refleks" },
    { id: "guc-merkezi", label: "Güç Merkezi", emoji: "💪", axis: "Fizik" },
    { id: "kaya-gibi", label: "Kaya Gibi", emoji: "🧱", axis: "Defans" },
    { id: "pas-makinesi", label: "Pas Makinesi", emoji: "🎯", axis: "Pas" },
    { id: "taktiksel", label: "Taktiksel", emoji: "🧠", axis: "Vizyon" },
  ],
  basketbol: [
    CENTILMEN,
    { id: "keskin-sutor", label: "Keskin Şutör", emoji: "🎯", axis: "Şut" },
    { id: "ribaund-canavari", label: "Ribaund Canavarı", emoji: "🧱", axis: "Ribaund" },
    { id: "guc-merkezi", label: "Güç Merkezi", emoji: "💪", axis: "Fizik" },
    { id: "savunma-duvari", label: "Savunma Duvarı", emoji: "🛡️", axis: "Savunma" },
    { id: "oyun-kurucu", label: "Oyun Kurucu", emoji: "🧠", axis: "Asist" },
    { id: "top-hirsizi", label: "Top Hırsızı", emoji: "🦊", axis: "T. Çalma" },
  ],
  voleybol: [
    CENTILMEN,
    { id: "smac-ustasi", label: "Smaç Ustası", emoji: "💥", axis: "Smaç" },
    { id: "blok-duvari", label: "Blok Duvarı", emoji: "🧱", axis: "Blok" },
    { id: "kedi-refleksi", label: "Kedi Refleksi", emoji: "🐱", axis: "Refleks" },
    { id: "manset-ustasi", label: "Manşet Ustası", emoji: "🙌", axis: "Manşet" },
    { id: "altin-pas", label: "Altın Pas", emoji: "🎯", axis: "Pas" },
    { id: "servis-makinesi", label: "Servis Makinesi", emoji: "🚀", axis: "Servis" },
  ],
  tenis: [
    CENTILMEN,
    { id: "servis-canavari", label: "Servis Canavarı", emoji: "🚀", axis: "Servis" },
    { id: "forehand-ustasi", label: "Forehand Ustası", emoji: "💪", axis: "Forehand" },
    { id: "backhand-ustasi", label: "Backhand Ustası", emoji: "🎾", axis: "Backhand" },
    { id: "file-ustasi", label: "File Ustası", emoji: "🕸️", axis: "Vole" },
    { id: "simsek", label: "Şimşek", emoji: "⚡", axis: "Hız" },
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
