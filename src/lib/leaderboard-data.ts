import "server-only";
import { getDb } from "./db";
import { reliabilityScore, resolveAttendanceCounts } from "./gamification";
import type { LeaderboardEntry } from "./leaderboard";
import { getMvpWinners, syncLevels } from "./progress";

/**
 * "Şehrin En İyileri" verisi: her oyuncunun güvenilirliği, onaylanmış maç sayısı ve MVP ödülleri.
 * Hepsi takım arkadaşlarının oylarından hesaplanır (bkz. gamification.ts). En az bir maçı onaylanan oyuncular listelenir.
 * Sıralama sayfası ISR ile 5 dakikada bir yenilendiği için bu sorgu her ziyarette değil, en fazla 5 dakikada bir çalışır.
 */
export async function getCityLeaderboard(): Promise<LeaderboardEntry[]> {
  await syncLevels();
  const db = await getDb();
  const rows = await db.query<{ player_id: string; total: number; absent: number }>(
    `SELECT mp.player_id, count(r.target_id)::int AS total, count(*) FILTER (WHERE r.attended = false)::int AS absent
     FROM match_participants mp
     JOIN matches m ON m.id = mp.match_id AND m.starts_at < now()
     LEFT JOIN match_reviews r ON r.match_id = mp.match_id AND r.target_id = mp.player_id
     GROUP BY mp.player_id, mp.match_id`,
  );
  const players = await db.query<{ id: string; name: string; initials: string; color: string }>("SELECT id, name, initials, color FROM players");
  const mvps = await getMvpWinners();

  const tally = new Map<string, { decided: number; attended: number }>();
  for (const r of rows) {
    const decision = resolveAttendanceCounts(r.total, r.absent);
    if (decision === null) continue;
    const t = tally.get(r.player_id) ?? { decided: 0, attended: 0 };
    t.decided += 1;
    if (decision) t.attended += 1;
    tally.set(r.player_id, t);
  }

  return players.flatMap((p) => {
    const t = tally.get(p.id);
    if (!t || t.attended === 0) return [];
    return [
      {
        id: p.id,
        name: p.name,
        initials: p.initials,
        color: p.color,
        rating: reliabilityScore(t.decided, t.attended),
        matches: t.attended,
        mvp: mvps.filter((m) => m.playerId === p.id).length,
      },
    ];
  });
}
