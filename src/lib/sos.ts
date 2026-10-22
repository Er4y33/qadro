import "server-only";
import { getDb } from "./db";
import { XP_REWARDS } from "./gamification";
import { getMatch, joinMatch, logEvent } from "./matches";
import { POSITIONS } from "./sports";
import { getVenue } from "./mock-data";
import type { Sport } from "./types";

/*
 * S.O.S (Joker) çağrıları.
 *
 * Akış: Kadrodaki bir oyuncu, eksik kalan maç için mevki seçip çağrı açar → çağrı, kadroda olmayan
 * oyuncuların Bildirimler ekranına düşer → ilk kabul eden kadroya eklenir ve çağrı kapanır.
 *
 * Oyunlaştırma: Yanıt veren oyuncu +40 XP kazanır ve "Kurtarıcı" başarımına ilerler
 * (Malone ve Lepper: iş birliği; Hexad: Philanthropist). Yanıt süresi panelde ölçülür (D6, 1. adım).
 */

export interface OpenSosCall {
  id: string;
  matchId: string;
  matchTitle: string;
  format: string;
  sport: Sport;
  venueShort: string;
  position: string;
  startsAt: string;
  openSlots: number;
  createdBy: string;
}

export type CreateSosResult =
  | { ok: true; id: string }
  | { ok: false; status: 400 | 403 | 404 | 409; error: string };

export async function createSos(matchId: string, playerId: string, position: string): Promise<CreateSosResult> {
  const match = await getMatch(matchId);
  if (!match) return { ok: false, status: 404, error: "Maç bulunamadı." };
  if (!POSITIONS[match.sport].includes(position)) return { ok: false, status: 400, error: "Bu branş için geçersiz mevki." };
  if (!match.participants.some((p) => p.id === playerId)) {
    return { ok: false, status: 403, error: "S.O.S çağrısını yalnızca maçın kadrosundaki oyuncular başlatabilir." };
  }
  if (new Date(match.startsAt).getTime() <= Date.now()) return { ok: false, status: 409, error: "Maç başladı, çağrı açılamaz." };
  if (match.joined >= match.capacity) return { ok: false, status: 409, error: "Kadro zaten tam." };

  const db = await getDb();
  const open = await db.query("SELECT 1 FROM sos_calls WHERE match_id = $1 AND answered_by IS NULL AND expires_at > now()", [matchId]);
  if (open.length > 0) return { ok: false, status: 409, error: "Bu maç için açık bir S.O.S çağrısı zaten var." };

  const [row] = await db.query<{ id: string }>(
    "INSERT INTO sos_calls (match_id, position, created_by, expires_at) VALUES ($1, $2, $3, $4) RETURNING id::text",
    [matchId, position, playerId, match.startsAt],
  );
  await logEvent(playerId, "sos_created", matchId, { position });
  return { ok: true, id: row.id };
}

/** Oyuncuya gösterilecek açık çağrılar: kadrosunda olmadığı, dolmamış ve başlamamış maçlar */
export async function listOpenSos(viewerId: string): Promise<OpenSosCall[]> {
  const db = await getDb();
  const rows = await db.query<{
    id: string;
    match_id: string;
    title: string;
    format: string;
    sport: Sport;
    venue_id: string;
    position: string;
    starts_at: Date;
    open_slots: number;
    created_by: string;
  }>(
    `SELECT s.id::text, s.match_id, m.title, m.format, m.sport, m.venue_id, s.position, m.starts_at,
            (m.capacity - (SELECT count(*) FROM match_participants mp WHERE mp.match_id = m.id))::int AS open_slots,
            p.name AS created_by
     FROM sos_calls s
     JOIN matches m ON m.id = s.match_id
     JOIN players p ON p.id = s.created_by
     WHERE s.answered_by IS NULL AND s.expires_at > now() AND s.created_by <> $1
       AND NOT EXISTS (SELECT 1 FROM match_participants mp WHERE mp.match_id = m.id AND mp.player_id = $1)
     ORDER BY m.starts_at`,
    [viewerId],
  );
  return rows
    .filter((r) => r.open_slots > 0)
    .map((r) => ({
      id: r.id,
      matchId: r.match_id,
      matchTitle: r.title,
      format: r.format,
      sport: r.sport,
      venueShort: getVenue(r.venue_id)?.shortName ?? "Saha",
      position: r.position,
      startsAt: new Date(r.starts_at).toISOString(),
      openSlots: r.open_slots,
      createdBy: r.created_by,
    }));
}

export type AnswerSosResult =
  | { ok: true; matchId: string; xp: number }
  | { ok: false; status: 404 | 409; error: string };

/**
 * Çağrıyı kabul eder. Çağrı önce tek SQL cümlesiyle "sahiplenilir" (answered_by IS NULL koşulu);
 * böylece iki oyuncu aynı anda kabul ederse yalnızca biri kazanır. Kadroya eklenemezse sahiplik geri alınır.
 */
export async function answerSos(callId: string, playerId: string): Promise<AnswerSosResult> {
  if (!/^\d+$/.test(callId)) return { ok: false, status: 404, error: "Çağrı bulunamadı." };
  const db = await getDb();
  const [claimed] = await db.query<{ match_id: string; created_at: Date; created_by: string }>(
    `UPDATE sos_calls SET answered_by = $2, answered_at = now()
     WHERE id = $1 AND answered_by IS NULL AND expires_at > now() AND created_by <> $2
     RETURNING match_id, created_at, created_by`,
    [callId, playerId],
  );
  if (!claimed) {
    const exists = await db.query("SELECT 1 FROM sos_calls WHERE id = $1", [callId]);
    return exists.length === 0
      ? { ok: false, status: 404, error: "Çağrı bulunamadı." }
      : { ok: false, status: 409, error: "Bu çağrıya başka bir oyuncu yanıt verdi ya da süresi doldu." };
  }

  const joined = await joinMatch(claimed.match_id, playerId);
  if (joined !== "joined") {
    await db.query("UPDATE sos_calls SET answered_by = NULL, answered_at = NULL WHERE id = $1", [callId]);
    return {
      ok: false,
      status: 409,
      error: joined === "already_joined" ? "Zaten bu maçın kadrosundasın." : "Maç doldu, yerin başkası tarafından alındı.",
    };
  }

  const responseSeconds = Math.round((Date.now() - new Date(claimed.created_at).getTime()) / 1000);
  await logEvent(playerId, "sos_answered", claimed.match_id, { callId: Number(callId), responseSeconds });
  return { ok: true, matchId: claimed.match_id, xp: XP_REWARDS.sosAnswered };
}
