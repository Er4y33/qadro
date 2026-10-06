/**
 * Yerel liderlik tablosu: "Şehrin En İyileri"
 *
 * Tasarım kararı (docs/oyunlastirma-rotasi.md, Akış bölümü):
 * Küresel tablo yerine ilçe bazlı tablo kullanılır. Oyuncu her zaman kendi sırasını
 * ve bir üst hedefe olan mesafesini görür ("İlk 10'a girmene X kaldı").
 * Böylece en altta kalan çoğunluk için de ulaşılabilir bir hedef olur.
 */

export type LeaderboardMetric = "rating" | "matches" | "mvp";

export const METRIC_LABELS: Record<LeaderboardMetric, string> = {
  rating: "Genel Puan",
  matches: "Maç Sayısı",
  mvp: "MVP Ödülleri",
};

export interface LeaderboardEntry {
  id: string;
  name: string;
  initials: string;
  color: string;
  rating: number;
  matches: number;
  mvp: number;
}

export const DISTRICT = "Onikişubat";

/** Örnek veri. Supabase bağlanınca ilçe bazlı sorgudan gelecek. */
export const leaderboard: LeaderboardEntry[] = [
  { id: "ahmet", name: "Ahmet Erdem", initials: "AE", color: "bg-warning", rating: 4.95, matches: 61, mvp: 18 },
  { id: "burak", name: "Burak", initials: "BU", color: "bg-slate-500", rating: 4.91, matches: 48, mvp: 9 },
  { id: "eray", name: "Eray", initials: "ER", color: "bg-info", rating: 4.88, matches: 55, mvp: 14 },
  { id: "mert", name: "Mert Boz", initials: "MB", color: "bg-violet", rating: 4.85, matches: 39, mvp: 7 },
  { id: "caner", name: "Caner K.", initials: "CN", color: "bg-slate-500", rating: 4.82, matches: 44, mvp: 6 },
  { id: "volkan", name: "Volkan", initials: "VL", color: "bg-danger", rating: 4.8, matches: 30, mvp: 5 },
  { id: "oguz", name: "Oğuz", initials: "OS", color: "bg-warning", rating: 4.79, matches: 52, mvp: 11 },
  { id: "can", name: "Can", initials: "CY", color: "bg-info", rating: 4.78, matches: 27, mvp: 4 },
  { id: "selin", name: "Selin", initials: "SE", color: "bg-violet", rating: 4.77, matches: 33, mvp: 8 },
  { id: "kaan", name: "Kaan", initials: "KA", color: "bg-danger", rating: 4.77, matches: 29, mvp: 3 },
  { id: "deniz", name: "Deniz", initials: "DE", color: "bg-info", rating: 4.76, matches: 24, mvp: 2 },
  { id: "atahan", name: "Atahan", initials: "AT", color: "bg-primary", rating: 4.75, matches: 42, mvp: 12 },
  { id: "yusuf", name: "Yusuf", initials: "YU", color: "bg-slate-500", rating: 4.7, matches: 20, mvp: 1 },
  { id: "emre", name: "Emre", initials: "EM", color: "bg-warning", rating: 4.62, matches: 18, mvp: 2 },
];

export interface RankedEntry extends LeaderboardEntry {
  rank: number;
  value: number;
}

/** Seçilen ölçüte göre sıralar. Eşit değerde daha çok maç oynayan öne geçer. */
export function rankBy(entries: LeaderboardEntry[], metric: LeaderboardMetric): RankedEntry[] {
  return [...entries]
    .sort((a, b) => b[metric] - a[metric] || b.matches - a.matches)
    .map((e, i) => ({ ...e, rank: i + 1, value: e[metric] }));
}

/** Oyuncunun bir üst hedefe (ilk 10, ilk 3 ya da zirve) kalan farkını hesaplar. */
export function nextGoal(ranked: RankedEntry[], playerId: string): { target: string; gap: number } | null {
  const me = ranked.find((e) => e.id === playerId);
  if (!me || me.rank === 1) return null;
  const goalRank = me.rank > 10 ? 10 : me.rank > 3 ? 3 : 1;
  const target = goalRank === 10 ? "İlk 10'a" : goalRank === 3 ? "İlk 3'e" : "Zirveye";
  const gap = ranked[goalRank - 1].value - me.value;
  return { target, gap: Math.round(gap * 100) / 100 };
}
