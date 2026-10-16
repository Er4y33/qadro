import "server-only";
import { getDb } from "./db";
import { reliabilityScore, resolveAttendanceCounts, XP_REWARDS } from "./gamification";
import { getMatch, logEvent } from "./matches";
import { PRAISES } from "./praise";
import type { LineupSlot, Match } from "./types";

/*
 * Maç sonu değerlendirmeleri ve bunlardan türeyen itibar (güvenilirlik, övgüler).
 *
 * Kurallar:
 * - Yalnızca maçın kadrosundaki oyuncular, maç başladıktan sonra değerlendirme yapabilir.
 * - Herkes bir maçı bir kez değerlendirir; kendini değerlendiremez.
 * - "Gelmedi" kararı tek kişinin oyuyla verilmez: en az 3 oy ve çoğunluk gerekir (gamification.ts).
 */

export type ReviewState = "open" | "not_member" | "not_started" | "already_reviewed";

export interface ReviewContext {
  match: Match;
  state: ReviewState;
  teammates: LineupSlot[];
}

export async function getReviewContext(matchId: string, viewerId: string): Promise<ReviewContext | null> {
  const match = await getMatch(matchId);
  if (!match) return null;

  // Dizilimde yeri olmayan oyuncular da değerlendirilsin: herkes için bir "slot" oluşturulur
  const teammates: LineupSlot[] = match.participants
    .filter((p) => p.id !== viewerId)
    .map((player) => match.lineup.find((slot) => slot.player.id === player.id) ?? { player, position: "", overall: 0, x: 0, y: 0 });

  let state: ReviewState = "open";
  if (!match.participants.some((p) => p.id === viewerId)) state = "not_member";
  else if (new Date(match.startsAt).getTime() > Date.now()) state = "not_started";
  else {
    const db = await getDb();
    const done = await db.query("SELECT 1 FROM match_reviews WHERE match_id = $1 AND reviewer_id = $2 LIMIT 1", [matchId, viewerId]);
    if (done.length > 0) state = "already_reviewed";
  }
  return { match, state, teammates };
}

export interface ReviewInput {
  playerId: string;
  attended: boolean;
  praiseId: string | null;
}

export type SubmitResult =
  | { ok: true; xp: number }
  | { ok: false; status: 400 | 403 | 404 | 409; error: string };

export function parseReviews(body: unknown): ReviewInput[] | null {
  const list = (body as { reviews?: unknown })?.reviews;
  if (!Array.isArray(list) || list.length === 0 || list.length > 30) return null;
  const parsed: ReviewInput[] = [];
  for (const item of list) {
    const r = item as Record<string, unknown>;
    if (typeof r.playerId !== "string" || typeof r.attended !== "boolean") return null;
    const praiseId = typeof r.praiseId === "string" && r.attended ? r.praiseId : null;
    if (praiseId && !PRAISES.some((p) => p.id === praiseId)) return null;
    parsed.push({ playerId: r.playerId, attended: r.attended, praiseId });
  }
  return parsed;
}

export async function submitReviews(matchId: string, reviewerId: string, reviews: ReviewInput[]): Promise<SubmitResult> {
  const context = await getReviewContext(matchId, reviewerId);
  if (!context) return { ok: false, status: 404, error: "Maç bulunamadı." };
  if (context.state === "not_member") return { ok: false, status: 403, error: "Yalnızca bu maçın oyuncuları değerlendirme yapabilir." };
  if (context.state === "not_started") return { ok: false, status: 409, error: "Maç henüz oynanmadı." };
  if (context.state === "already_reviewed") return { ok: false, status: 409, error: "Bu maçı zaten değerlendirdin." };

  const teammateIds = new Set(context.teammates.map((t) => t.player.id));
  if (reviews.some((r) => !teammateIds.has(r.playerId)) || new Set(reviews.map((r) => r.playerId)).size !== reviews.length) {
    return { ok: false, status: 400, error: "Değerlendirme listesi bu maçın kadrosuyla uyuşmuyor." };
  }

  const db = await getDb();
  for (const r of reviews) {
    await db.query(
      `INSERT INTO match_reviews (match_id, reviewer_id, target_id, attended, praise_id)
       VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
      [matchId, reviewerId, r.playerId, r.attended, r.praiseId],
    );
  }
  const xp = reviews.length * XP_REWARDS.ratedOthers;
  await logEvent(reviewerId, "match_reviewed", matchId, {
    reviewed: reviews.length,
    praises: reviews.filter((r) => r.praiseId).length,
    absentVotes: reviews.filter((r) => !r.attended).length,
  });
  return { ok: true, xp };
}

export interface Reputation {
  /** Oynanmış (başlama saati geçmiş) maç sayısı */
  pastMatches: number;
  /** Çoğunluk oyuyla "Gelmedi" kararı verilen maçlar */
  noShows: number;
  /** Gelme durumu kesinleşen (en az 3 oy) maçlar */
  decided: number;
  reliability: number;
  /** Değerlendirdiği maç sayısı ("Adil Oyuncu" başarımı) */
  ratingsGiven: number;
  /** Değerlendirdiği oyuncu sayısı (her biri XP kazandırır) */
  reviewsGiven: number;
  praises: { id: string; label: string; emoji: string; count: number }[];
}

export async function getReputation(playerId: string): Promise<Reputation> {
  const db = await getDb();
  const perMatch = await db.query<{ total: number; absent: number }>(
    `SELECT count(r.target_id)::int AS total, count(*) FILTER (WHERE r.attended = false)::int AS absent
     FROM match_participants mp
     JOIN matches m ON m.id = mp.match_id AND m.starts_at < now()
     LEFT JOIN match_reviews r ON r.match_id = mp.match_id AND r.target_id = mp.player_id
     WHERE mp.player_id = $1
     GROUP BY mp.match_id`,
    [playerId],
  );
  const decisions = perMatch.map((m) => resolveAttendanceCounts(m.total, m.absent));
  const decided = decisions.filter((d) => d !== null).length;
  const attended = decisions.filter((d) => d === true).length;
  const noShows = decisions.filter((d) => d === false).length;

  const [given] = await db.query<{ matches: number; people: number }>(
    "SELECT count(DISTINCT match_id)::int AS matches, count(*)::int AS people FROM match_reviews WHERE reviewer_id = $1",
    [playerId],
  );
  const praiseRows = await db.query<{ praise_id: string; n: number }>(
    "SELECT praise_id, count(*)::int AS n FROM match_reviews WHERE target_id = $1 AND praise_id IS NOT NULL GROUP BY praise_id",
    [playerId],
  );

  return {
    pastMatches: perMatch.length,
    noShows,
    decided,
    reliability: reliabilityScore(decided, attended),
    ratingsGiven: given.matches,
    reviewsGiven: given.people,
    praises: PRAISES.map((p) => ({ ...p, count: praiseRows.find((r) => r.praise_id === p.id)?.n ?? 0 })),
  };
}
