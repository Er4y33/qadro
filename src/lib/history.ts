import "server-only";
import { getDb } from "./db";
import { praiseById } from "./praise";
import { getMvpWinners, getPlayedMatches, type Outcome } from "./progress";
import { getVenue } from "./venues";
import type { Sport } from "./types";

/*
 * Maç Geçmişi (Melih'in Kasım 2026 tasarımı): oyuncunun oynanmış bütün maçları, aylara göre.
 * Her maçın durumu takım arkadaşlarının oylarından gelir (progress.ts → getPlayedMatches):
 * - Oynandı: en az 3 oy ve çoğunluk "Geldi" → XP verildi
 * - Gidilmedi: çoğunluk "Gelmedi" → güvenilirlik puanı düştü
 * - Onay bekliyor: henüz yeterli oy yok
 */

export interface HistoryEntry {
  matchId: string;
  title: string;
  sport: Sport;
  format: string;
  venueShort: string;
  startsAt: string;
  outcome: Outcome;
  /** Bu maçta takım arkadaşlarından alınan övgüler */
  praises: { id: string; emoji: string; label: string; count: number }[];
  mvp: boolean;
  organizer: boolean;
}

export interface MatchHistory {
  entries: HistoryEntry[];
  /** Toplam oynanmış maç (durumu ne olursa olsun) */
  total: number;
  /** Bütün maçlarda alınan övgü sayısı */
  praisesReceived: number;
}

export async function getMatchHistory(playerId: string, sport?: Sport): Promise<MatchHistory> {
  const played = await getPlayedMatches(playerId);
  if (played.length === 0) return { entries: [], total: 0, praisesReceived: 0 };

  const db = await getDb();
  const ids = played.map((p) => p.matchId);
  const [matches, praiseRows, mvps] = await Promise.all([
    db.query<{ id: string; title: string; sport: Sport; format: string; venue_id: string; organizer_id: string }>(
      "SELECT id, title, sport, format, venue_id, organizer_id FROM matches WHERE id = ANY($1)",
      [ids],
    ),
    db.query<{ match_id: string; praise_id: string; n: number }>(
      `SELECT match_id, praise_id, count(*)::int AS n FROM match_reviews
       WHERE target_id = $1 AND praise_id IS NOT NULL AND match_id = ANY($2) GROUP BY match_id, praise_id`,
      [playerId, ids],
    ),
    getMvpWinners(),
  ]);

  const entries = played
    .map((p): HistoryEntry | null => {
      const m = matches.find((x) => x.id === p.matchId);
      if (!m) return null;
      return {
        matchId: m.id,
        title: m.title,
        sport: m.sport,
        format: m.format,
        venueShort: getVenue(m.venue_id)?.shortName ?? "Saha",
        startsAt: p.startsAt.toISOString(),
        outcome: p.outcome,
        praises: praiseRows
          .filter((r) => r.match_id === m.id)
          .map((r) => {
            const praise = praiseById(r.praise_id);
            return { id: r.praise_id, emoji: praise?.emoji ?? "👏", label: praise?.label ?? r.praise_id, count: r.n };
          })
          .sort((a, b) => b.count - a.count),
        mvp: mvps.some((w) => w.matchId === m.id && w.playerId === playerId),
        organizer: m.organizer_id === playerId,
      };
    })
    .filter((e): e is HistoryEntry => e !== null && (!sport || e.sport === sport))
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt));

  return {
    entries,
    total: entries.length,
    praisesReceived: entries.reduce((sum, e) => sum + e.praises.reduce((s, p) => s + p.count, 0), 0),
  };
}

/** "Ekim 2026" gibi ay başlıklarına göre gruplar (sıra korunur) */
export function groupByMonth<T extends { startsAt: string }>(entries: T[], timeZone = "Europe/Istanbul"): { month: string; entries: T[] }[] {
  const fmt = new Intl.DateTimeFormat("tr-TR", { timeZone, month: "long", year: "numeric" });
  const groups: { month: string; entries: T[] }[] = [];
  for (const e of entries) {
    const month = fmt.format(new Date(e.startsAt));
    const last = groups.at(-1);
    if (last?.month === month) last.entries.push(e);
    else groups.push({ month, entries: [e] });
  }
  return groups;
}
