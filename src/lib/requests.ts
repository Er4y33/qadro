import "server-only";
import { getDb } from "./db";
import { reliabilityScore, resolveAttendanceCounts } from "./gamification";
import { joinMatch, logEvent } from "./matches";

/*
 * Onaylı katılım ("İstekleri Yönet" ve "Onaylanan Kadro" ekranları).
 *
 * Organizatör maçı oluştururken "Katılımı ben onaylayayım" seçeneğini açarsa:
 * 1. "Maça Katıl" kadroya eklemez, bekleyen bir istek oluşturur (API 202 Accepted: istek alındı, sonuç sonra belli olacak).
 * 2. Organizatör istekleri oyuncunun güvenilirliğine bakarak onaylar ya da reddeder.
 * 3. Onay, joinMatch() ile aynı kilitli işlemden geçer: kadro bu arada dolduysa onay 409 ile reddedilir.
 * Amaç (D6, hedef davranış): organizatörün "gelmeyecek oyuncu" riskini azaltması; güvenilirlik puanı burada işe yarar.
 */

export type RequestResult = "requested" | "already_requested" | "declined_before";

/** Oyuncunun katılma isteğini kaydeder. Daha önce reddedildiyse tekrar istek atamaz (organizatörü rahatsız etmesin diye). */
export async function requestToJoin(matchId: string, playerId: string, slot?: { position: string; x: number; y: number }): Promise<RequestResult> {
  const db = await getDb();
  const inserted = await db.query(
    `INSERT INTO join_requests (match_id, player_id, position, x, y) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (match_id, player_id) DO NOTHING RETURNING player_id`,
    [matchId, playerId, slot?.position ?? null, slot?.x ?? null, slot?.y ?? null],
  );
  if (inserted.length > 0) {
    await logEvent(playerId, "join_requested", matchId);
    return "requested";
  }
  const [row] = await db.query<{ status: string }>("SELECT status FROM join_requests WHERE match_id = $1 AND player_id = $2", [matchId, playerId]);
  return row?.status === "declined" ? "declined_before" : "already_requested";
}

/** Oyuncunun bekleyen isteğini geri çeker. Silinecek istek yoksa false. */
export async function cancelRequest(matchId: string, playerId: string): Promise<boolean> {
  const db = await getDb();
  const deleted = await db.query("DELETE FROM join_requests WHERE match_id = $1 AND player_id = $2 AND status = 'pending' RETURNING player_id", [
    matchId,
    playerId,
  ]);
  return deleted.length > 0;
}

/** Oyuncunun bu maçtaki isteğinin durumu (yoksa null) */
export async function getRequestStatus(matchId: string, playerId: string): Promise<"pending" | "approved" | "declined" | null> {
  const db = await getDb();
  const [row] = await db.query<{ status: "pending" | "approved" | "declined" }>(
    "SELECT status FROM join_requests WHERE match_id = $1 AND player_id = $2",
    [matchId, playerId],
  );
  return row?.status ?? null;
}

export interface PendingRequest {
  playerId: string;
  name: string;
  initials: string;
  color: string;
  level: number;
  position: string | null;
  requestedAt: string;
  /** Takım arkadaşlarının oylarından hesaplanan güvenilirlik (0–5) ve onaylı maç sayısı */
  reliability: number;
  confirmedMatches: number;
  noShows: number;
}

export type RequestsResult = { ok: true; requests: PendingRequest[] } | { ok: false; status: 403 | 404; error: string };

async function organizerCheck(matchId: string, viewerId: string): Promise<{ ok: true } | { ok: false; status: 403 | 404; error: string }> {
  const db = await getDb();
  const [match] = await db.query<{ organizer_id: string }>("SELECT organizer_id FROM matches WHERE id = $1", [matchId]);
  if (!match) return { ok: false, status: 404, error: "Maç bulunamadı." };
  if (match.organizer_id !== viewerId) return { ok: false, status: 403, error: "İstekleri yalnızca organizatör yönetebilir." };
  return { ok: true };
}

/** Organizatör için bekleyen istekler; her oyuncunun güvenilirliğiyle birlikte (karar vermeye yardımcı olsun diye) */
export async function listRequests(matchId: string, viewerId: string): Promise<RequestsResult> {
  const check = await organizerCheck(matchId, viewerId);
  if (!check.ok) return check;
  const db = await getDb();
  const rows = await db.query<{ player_id: string; name: string; initials: string; color: string; level: number; position: string | null; created_at: Date }>(
    `SELECT r.player_id, p.name, p.initials, p.color, p.level, r.position, r.created_at
     FROM join_requests r JOIN players p ON p.id = r.player_id
     WHERE r.match_id = $1 AND r.status = 'pending' ORDER BY r.created_at`,
    [matchId],
  );
  if (rows.length === 0) return { ok: true, requests: [] };
  const votes = await db.query<{ player_id: string; total: number; absent: number }>(
    `SELECT mp.player_id, count(r.target_id)::int AS total, count(*) FILTER (WHERE r.attended = false)::int AS absent
     FROM match_participants mp
     JOIN matches m ON m.id = mp.match_id AND m.starts_at < now()
     LEFT JOIN match_reviews r ON r.match_id = mp.match_id AND r.target_id = mp.player_id
     WHERE mp.player_id = ANY($1)
     GROUP BY mp.player_id, mp.match_id`,
    [rows.map((r) => r.player_id)],
  );
  return {
    ok: true,
    requests: rows.map((r) => {
      const decisions = votes.filter((v) => v.player_id === r.player_id).map((v) => resolveAttendanceCounts(v.total, v.absent));
      const decided = decisions.filter((d) => d !== null).length;
      const attended = decisions.filter((d) => d === true).length;
      return {
        playerId: r.player_id,
        name: r.name,
        initials: r.initials,
        color: r.color,
        level: r.level,
        position: r.position,
        requestedAt: new Date(r.created_at).toISOString(),
        reliability: reliabilityScore(decided, attended),
        confirmedMatches: attended,
        noShows: decisions.filter((d) => d === false).length,
      };
    }),
  };
}

export type DecisionResult = { ok: true } | { ok: false; status: 400 | 403 | 404 | 409; error: string };

/** Organizatörün kararı. Onayda kadroya ekleme joinMatch'in kilitli işlemiyle yapılır (kontenjan aşılamaz). */
export async function decideRequest(matchId: string, viewerId: string, playerId: string, decision: unknown): Promise<DecisionResult> {
  if (decision !== "approve" && decision !== "decline") return { ok: false, status: 400, error: "Karar 'approve' ya da 'decline' olmalı." };
  const check = await organizerCheck(matchId, viewerId);
  if (!check.ok) return check;
  const db = await getDb();
  const [request] = await db.query<{ position: string | null; x: number | null; y: number | null }>(
    "SELECT position, x, y FROM join_requests WHERE match_id = $1 AND player_id = $2 AND status = 'pending'",
    [matchId, playerId],
  );
  if (!request) return { ok: false, status: 404, error: "Bekleyen istek bulunamadı." };

  if (decision === "approve") {
    const slot = request.position && request.x !== null && request.y !== null ? { position: request.position, x: request.x, y: request.y } : undefined;
    const joined = await joinMatch(matchId, playerId, slot);
    if (joined === "full") return { ok: false, status: 409, error: "Kadro dolu. Önce birini çıkar ya da isteği reddet." };
  }
  await db.query("UPDATE join_requests SET status = $3, decided_at = now() WHERE match_id = $1 AND player_id = $2", [
    matchId,
    playerId,
    decision === "approve" ? "approved" : "declined",
  ]);
  await logEvent(viewerId, "request_approved", matchId, { playerId, decision });
  return { ok: true };
}

/** Organizatörün bir oyuncuyu kadrodan çıkarması ("Onaylanan Kadro" ekranı) */
export async function removeParticipant(matchId: string, viewerId: string, playerId: string): Promise<DecisionResult> {
  const check = await organizerCheck(matchId, viewerId);
  if (!check.ok) return check;
  if (playerId === viewerId) return { ok: false, status: 409, error: "Organizatör kendini kadrodan çıkaramaz." };
  const db = await getDb();
  const deleted = await db.query("DELETE FROM match_participants WHERE match_id = $1 AND player_id = $2 RETURNING player_id", [matchId, playerId]);
  if (deleted.length === 0) return { ok: false, status: 404, error: "Oyuncu kadroda değil." };
  // Çıkarılan oyuncunun isteği varsa reddedildi sayılır: tekrar istek atıp organizatörü rahatsız edemez
  await db.query("UPDATE join_requests SET status = 'declined', decided_at = now() WHERE match_id = $1 AND player_id = $2", [matchId, playerId]);
  await logEvent(viewerId, "participant_removed", matchId, { playerId });
  return { ok: true };
}
