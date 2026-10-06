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
}

export const PRAISES: Praise[] = [
  { id: "centilmen", label: "Centilmen", emoji: "🎩" },
  { id: "dinamik", label: "Dinamik", emoji: "⚡" },
  { id: "kaya-gibi", label: "Kaya Gibi", emoji: "🧱" },
  { id: "taktiksel", label: "Taktiksel", emoji: "🧠" },
];

/** Kısa mevki etiketlerinin değerlendirme ekranındaki açık hali */
export const POSITION_NAMES: Record<string, string> = {
  Snt: "Forvet",
  SolO: "Orta Saha (Sol)",
  SağO: "Orta Saha (Sağ)",
  Stp: "Defans",
  Klc: "Kaleci",
};
