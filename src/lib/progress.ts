import "server-only";
import { getDb } from "./db";
import { levelFromXp, reliabilityScore, resolveAttendanceCounts, resolveMvp, resolveOnTime, seasonOf, weeklyStreak, XP_REWARDS, type Season, type Streak } from "./gamification";

/*
 * Oyuncu ilerlemesi: onaylanan maçlar, MVP ödülleri, S.O.S yanıtları, haftalık seri ve sezon XP'si.
 *
 * Sahte maç engeli (rota belgesi, Riskler):
 * Bir maçın XP'si, oyuncunun maça geldiği takım arkadaşlarının oylarıyla ONAYLANDIĞINDA verilir
 * (en az 3 oy ve çoğunluk "Geldi"). Tek başına maç açıp "oynadım" demek XP kazandırmaz.
 */

export type Outcome = "confirmed" | "pending" | "no_show";

export interface PlayedMatch {
  matchId: string;
  startsAt: Date;
  outcome: Outcome;
}

/** Oyuncunun başlama saati geçmiş maçları ve her birinde katılımının durumu */
export async function getPlayedMatches(playerId: string, range?: { from: Date; to: Date }): Promise<PlayedMatch[]> {
  const db = await getDb();
  const rows = await db.query<{ match_id: string; starts_at: Date; total: number; absent: number }>(
    `SELECT mp.match_id, m.starts_at, count(r.target_id)::int AS total,
            count(*) FILTER (WHERE r.attended = false)::int AS absent
     FROM match_participants mp
     JOIN matches m ON m.id = mp.match_id AND m.starts_at < now()
       AND ($2::timestamptz IS NULL OR m.starts_at >= $2) AND ($3::timestamptz IS NULL OR m.starts_at < $3)
     LEFT JOIN match_reviews r ON r.match_id = mp.match_id AND r.target_id = mp.player_id
     WHERE mp.player_id = $1
     GROUP BY mp.match_id, m.starts_at`,
    [playerId, range?.from.toISOString() ?? null, range?.to.toISOString() ?? null],
  );
  return rows.map((r) => {
    const decision = resolveAttendanceCounts(r.total, r.absent);
    return { matchId: r.match_id, startsAt: new Date(r.starts_at), outcome: decision === null ? "pending" : decision ? "confirmed" : "no_show" };
  });
}

/** Maç başına MVP kararları (yalnızca bir MVP'si olan maçlar) */
export async function getMvpWinners(range?: { from: Date; to: Date }): Promise<{ matchId: string; playerId: string }[]> {
  const db = await getDb();
  const rows = await db.query<{ match_id: string; target_id: string; n: number }>(
    `SELECT v.match_id, v.target_id, count(*)::int AS n
     FROM match_mvp_votes v JOIN matches m ON m.id = v.match_id
     WHERE ($1::timestamptz IS NULL OR m.starts_at >= $1) AND ($2::timestamptz IS NULL OR m.starts_at < $2)
     GROUP BY v.match_id, v.target_id`,
    [range?.from.toISOString() ?? null, range?.to.toISOString() ?? null],
  );
  const byMatch = new Map<string, { targetId: string; count: number }[]>();
  for (const r of rows) byMatch.set(r.match_id, [...(byMatch.get(r.match_id) ?? []), { targetId: r.target_id, count: r.n }]);
  return [...byMatch].flatMap(([matchId, votes]) => {
    const playerId = resolveMvp(votes);
    return playerId ? [{ matchId, playerId }] : [];
  });
}

export async function countMvpAwards(playerId: string): Promise<number> {
  return (await getMvpWinners()).filter((w) => w.playerId === playerId).length;
}

export async function countSosAnswered(playerId: string): Promise<number> {
  const db = await getDb();
  const [row] = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM sos_calls WHERE answered_by = $1", [playerId]);
  return row.n;
}

export async function getStreak(playerId: string): Promise<Streak> {
  const played = await getPlayedMatches(playerId);
  return weeklyStreak(played.filter((m) => m.outcome !== "no_show").map((m) => m.startsAt));
}

/* ───────────── Sezon sıralaması ───────────── */

export interface SeasonEntry {
  playerId: string;
  name: string;
  initials: string;
  color: string;
  xp: number;
  rank: number;
}

export interface SeasonStandings {
  season: Season;
  entries: SeasonEntry[];
}

/**
 * Sezon XP'si: sezon içinde onaylanan maçlar, değerlendirilen oyuncular, yanıtlanan S.O.S çağrıları ve MVP ödülleri.
 * Kaynaklar XP_REWARDS'taki tek tablodan gelir; profil ve sıralama aynı kuralı kullanır.
 */
export async function getSeasonStandings(now = new Date()): Promise<SeasonStandings> {
  const season = seasonOf(now);
  return { season, entries: await xpTable({ from: season.start, to: season.end }) };
}

/** Tüm zamanların XP'si (profildeki toplam XP ile aynı kural) */
export const allTimeXp = () => xpTable({ from: new Date("2000-01-01T00:00:00Z"), to: new Date("2100-01-01T00:00:00Z") });

/**
 * players tablosundaki seviye ve puan sütunlarını oylardan hesaplanan değerlerle eşitler.
 * Maç kartları ve kadro listeleri bu sütunları okur ("Lvl. 3 • 4.6 Yıldız", "Seviyeme uygun" filtresi);
 * her sayfada yeniden hesaplamak yerine burada güncellenir. Sıralama sayfası her yeniden üretildiğinde
 * (ISR, en fazla 5 dakikada bir), demo sıfırlanınca ve profil açılınca çalışır.
 */
export async function syncLevels() {
  const db = await getDb();
  const xp = new Map((await allTimeXp()).map((e) => [e.playerId, e.xp]));
  const votes = await db.query<{ player_id: string; total: number; absent: number }>(
    `SELECT mp.player_id, count(r.target_id)::int AS total, count(*) FILTER (WHERE r.attended = false)::int AS absent
     FROM match_participants mp
     JOIN matches m ON m.id = mp.match_id AND m.starts_at < now()
     LEFT JOIN match_reviews r ON r.match_id = mp.match_id AND r.target_id = mp.player_id
     GROUP BY mp.player_id, mp.match_id`,
  );
  const players = await db.query<{ id: string; level: number; rating: number }>("SELECT id, level, rating FROM players");
  for (const p of players) {
    const decisions = votes.filter((v) => v.player_id === p.id).map((v) => resolveAttendanceCounts(v.total, v.absent));
    const rating = reliabilityScore(decisions.filter((d) => d !== null).length, decisions.filter((d) => d === true).length);
    const level = levelFromXp(xp.get(p.id) ?? 0).level;
    if (level !== p.level || rating !== p.rating) await db.query("UPDATE players SET level = $2, rating = $3 WHERE id = $1", [p.id, level, rating]);
  }
}

async function xpTable(range: { from: Date; to: Date }): Promise<SeasonEntry[]> {
  const db = await getDb();

  const attendance = await db.query<{ player_id: string; total: number; absent: number; late: number }>(
    `SELECT mp.player_id, count(r.target_id)::int AS total, count(*) FILTER (WHERE r.attended = false)::int AS absent,
            count(*) FILTER (WHERE r.late)::int AS late
     FROM match_participants mp
     JOIN matches m ON m.id = mp.match_id AND m.starts_at < now() AND m.starts_at >= $1 AND m.starts_at < $2
     LEFT JOIN match_reviews r ON r.match_id = mp.match_id AND r.target_id = mp.player_id
     GROUP BY mp.player_id, mp.match_id`,
    [range.from.toISOString(), range.to.toISOString()],
  );
  const reviews = await db.query<{ player_id: string; n: number }>(
    "SELECT reviewer_id AS player_id, count(*)::int AS n FROM match_reviews WHERE created_at >= $1 AND created_at < $2 GROUP BY reviewer_id",
    [range.from.toISOString(), range.to.toISOString()],
  );
  const sos = await db.query<{ player_id: string; n: number }>(
    "SELECT answered_by AS player_id, count(*)::int AS n FROM sos_calls WHERE answered_by IS NOT NULL AND answered_at >= $1 AND answered_at < $2 GROUP BY answered_by",
    [range.from.toISOString(), range.to.toISOString()],
  );
  const mvps = await getMvpWinners(range);
  const players = await db.query<{ id: string; name: string; initials: string; color: string }>(
    "SELECT id, name, initials, color FROM players",
  );

  const xp = new Map<string, number>();
  const add = (id: string, amount: number) => xp.set(id, (xp.get(id) ?? 0) + amount);
  for (const a of attendance) {
    if (resolveAttendanceCounts(a.total, a.absent) === true) add(a.player_id, XP_REWARDS.matchAttended);
    if (resolveOnTime(a.total, a.absent, a.late) === true) add(a.player_id, XP_REWARDS.onTime);
  }
  for (const r of reviews) add(r.player_id, r.n * XP_REWARDS.ratedOthers);
  for (const s of sos) add(s.player_id, s.n * XP_REWARDS.sosAnswered);
  for (const m of mvps) add(m.playerId, XP_REWARDS.mvp);

  return players
    .map((p) => ({ playerId: p.id, name: p.name, initials: p.initials, color: p.color, xp: xp.get(p.id) ?? 0 }))
    .filter((e) => e.xp > 0)
    .sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name, "tr"))
    .map((e, i) => ({ ...e, rank: i + 1 }));
}
