import type { Sport } from "./types";

/** Her branşın format seçenekleri ve toplam oyuncu sayısı (maçın kontenjanı) */
export const FORMATS: Record<Sport, { label: string; players: number }[]> = {
  futbol: [
    { label: "5v5", players: 10 },
    { label: "6v6", players: 12 },
    { label: "7v7", players: 14 },
    { label: "8v8", players: 16 },
  ],
  basketbol: [
    { label: "3v3", players: 6 },
    { label: "5v5", players: 10 },
  ],
  voleybol: [
    { label: "4v4", players: 8 },
    { label: "6v6", players: 12 },
  ],
  tenis: [
    { label: "Tekler", players: 2 },
    { label: "Çiftler", players: 4 },
  ],
};

export const SPORT_EMOJI: Record<Sport, string> = { futbol: "⚽", basketbol: "🏀", voleybol: "🏐", tenis: "🎾" };

export function isSport(value: unknown): value is Sport {
  return typeof value === "string" && value in FORMATS;
}

export function capacityFor(sport: Sport, format: string): number | undefined {
  return FORMATS[sport].find((f) => f.label === format)?.players;
}
