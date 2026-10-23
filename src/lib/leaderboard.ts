/**
 * Yerel liderlik tablosu: "Şehrin En İyileri" (sıralama kuralları; veri src/lib/leaderboard-data.ts'ten gelir)
 *
 * Tasarım kararı (docs/oyunlastirma-rotasi.md, Akış bölümü):
 * Küresel tablo yerine ilçe bazlı tablo kullanılır. Oyuncu her zaman kendi sırasını
 * ve bir üst hedefe olan mesafesini görür ("İlk 10'a girmene X kaldı").
 * Böylece en altta kalan çoğunluk için de ulaşılabilir bir hedef olur.
 */

export type LeaderboardMetric = "rating" | "matches" | "mvp";

export const METRIC_LABELS: Record<LeaderboardMetric, string> = {
  rating: "Güvenilirlik",
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

/** Sıralamanın kapsadığı şehir (sahalar şimdilik yalnızca Kahramanmaraş'ta) */
export const CITY = "Kahramanmaraş";

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
