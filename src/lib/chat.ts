import "server-only";
import { getDb } from "./db";
import { logEvent } from "./matches";
import type { Sport } from "./types";

/*
 * Takım sohbeti: her maçın kadrosu kendi grup sohbetine sahiptir.
 *
 * Kurallar:
 * - Mesajları yalnızca maçın kadrosundaki oyuncular okuyabilir ve yazabilir (API 403).
 * - Mesaj 1–500 karakter. Boşluklar kırpılır.
 * - Yeni mesajlar istemcide birkaç saniyede bir "?after=<son id>" ile sorulur (polling).
 *   Gerçek zamanlı bağlantı (WebSocket) yerine bu yöntem seçildi: sunucusuz (Vercel) ortamda
 *   ek servis gerektirmez ve kadro sohbeti için birkaç saniyelik gecikme yeterlidir.
 */

export const MAX_MESSAGE_LENGTH = 500;

export interface ChatMessageRow {
  id: number;
  senderId: string;
  senderName: string;
  initials: string;
  color: string;
  body: string;
  createdAt: string;
}

export interface ChatSummary {
  matchId: string;
  title: string;
  format: string;
  sport: Sport;
  startsAt: string;
  lastSender: string | null;
  lastSenderId: string | null;
  lastMessage: string | null;
  lastAt: string | null;
  unread: number;
}

async function isMember(matchId: string, playerId: string): Promise<boolean | null> {
  const db = await getDb();
  const [row] = await db.query<{ member: boolean }>(
    `SELECT EXISTS (SELECT 1 FROM match_participants WHERE match_id = m.id AND player_id = $2) AS member
     FROM matches m WHERE m.id = $1`,
    [matchId, playerId],
  );
  return row ? row.member : null; // null → maç yok
}

/** Oyuncunun kadrosunda olduğu maçların sohbetleri; son mesajı en yeni olan en üstte */
export async function listChats(playerId: string): Promise<ChatSummary[]> {
  const db = await getDb();
  const rows = await db.query<{
    match_id: string;
    title: string;
    format: string;
    sport: Sport;
    starts_at: Date;
    last_sender: string | null;
    last_sender_id: string | null;
    last_message: string | null;
    last_at: Date | null;
    unread: number;
  }>(
    `SELECT m.id AS match_id, m.title, m.format, m.sport, m.starts_at,
            lm.sender_name AS last_sender, lm.sender_id AS last_sender_id, lm.body AS last_message, lm.created_at AS last_at,
            (SELECT count(*)::int FROM messages x
              WHERE x.match_id = m.id AND x.sender_id <> $1
                AND x.id > COALESCE((SELECT last_read_id FROM chat_reads r WHERE r.match_id = m.id AND r.player_id = $1), 0)) AS unread
     FROM match_participants mp
     JOIN matches m ON m.id = mp.match_id
     LEFT JOIN LATERAL (
       SELECT msg.body, msg.created_at, msg.sender_id, p.name AS sender_name
       FROM messages msg JOIN players p ON p.id = msg.sender_id
       WHERE msg.match_id = m.id ORDER BY msg.id DESC LIMIT 1
     ) lm ON true
     WHERE mp.player_id = $1
     ORDER BY COALESCE(lm.created_at, m.created_at) DESC`,
    [playerId],
  );
  return rows.map((r) => ({
    matchId: r.match_id,
    title: r.title,
    format: r.format,
    sport: r.sport,
    startsAt: new Date(r.starts_at).toISOString(),
    lastSender: r.last_sender,
    lastSenderId: r.last_sender_id,
    lastMessage: r.last_message,
    lastAt: r.last_at ? new Date(r.last_at).toISOString() : null,
    unread: r.unread,
  }));
}

export type MessagesResult =
  | { ok: true; messages: ChatMessageRow[] }
  | { ok: false; status: 403 | 404; error: string };

/** Sohbetin mesajları. afterId verilirse yalnızca ondan sonrakiler (yeni mesaj sorgusu). */
export async function getMessages(matchId: string, playerId: string, afterId = 0): Promise<MessagesResult> {
  const member = await isMember(matchId, playerId);
  if (member === null) return { ok: false, status: 404, error: "Maç bulunamadı." };
  if (!member) return { ok: false, status: 403, error: "Takım sohbeti yalnızca kadrodaki oyunculara açık." };

  const db = await getDb();
  const rows = await db.query<{ id: string; sender_id: string; name: string; initials: string; color: string; body: string; created_at: Date }>(
    `SELECT * FROM (
       SELECT msg.id::text, msg.sender_id, p.name, p.initials, p.color, msg.body, msg.created_at
       FROM messages msg JOIN players p ON p.id = msg.sender_id
       WHERE msg.match_id = $1 AND msg.id > $2
       ORDER BY msg.id DESC LIMIT 200
     ) last ORDER BY id::bigint`,
    [matchId, afterId],
  );
  const messages = rows.map((r) => ({
    id: Number(r.id),
    senderId: r.sender_id,
    senderName: r.name,
    initials: r.initials,
    color: r.color,
    body: r.body,
    createdAt: new Date(r.created_at).toISOString(),
  }));
  // Okundu bilgisi: son görülen mesaj kaydedilir
  if (messages.length > 0) {
    await db.query(
      `INSERT INTO chat_reads (match_id, player_id, last_read_id) VALUES ($1, $2, $3)
       ON CONFLICT (match_id, player_id) DO UPDATE SET last_read_id = GREATEST(chat_reads.last_read_id, EXCLUDED.last_read_id)`,
      [matchId, playerId, messages.at(-1)!.id],
    );
  }
  return { ok: true, messages };
}

export type SendResult = { ok: true; message: ChatMessageRow } | { ok: false; status: 400 | 403 | 404; error: string };

export async function sendMessage(matchId: string, playerId: string, raw: unknown): Promise<SendResult> {
  const body = typeof raw === "string" ? raw.trim() : "";
  if (body.length === 0 || body.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, status: 400, error: `Mesaj 1–${MAX_MESSAGE_LENGTH} karakter olmalı.` };
  }
  const member = await isMember(matchId, playerId);
  if (member === null) return { ok: false, status: 404, error: "Maç bulunamadı." };
  if (!member) return { ok: false, status: 403, error: "Takım sohbetine yalnızca kadrodaki oyuncular yazabilir." };

  const db = await getDb();
  const [row] = await db.query<{ id: string; created_at: Date; name: string; initials: string; color: string }>(
    `WITH inserted AS (
       INSERT INTO messages (match_id, sender_id, body) VALUES ($1, $2, $3) RETURNING id, created_at, sender_id
     )
     SELECT i.id::text, i.created_at, p.name, p.initials, p.color FROM inserted i JOIN players p ON p.id = i.sender_id`,
    [matchId, playerId, body],
  );
  await db.query(
    `INSERT INTO chat_reads (match_id, player_id, last_read_id) VALUES ($1, $2, $3)
     ON CONFLICT (match_id, player_id) DO UPDATE SET last_read_id = GREATEST(chat_reads.last_read_id, EXCLUDED.last_read_id)`,
    [matchId, playerId, Number(row.id)],
  );
  await logEvent(playerId, "message_sent", matchId, { length: body.length });
  return {
    ok: true,
    message: {
      id: Number(row.id),
      senderId: playerId,
      senderName: row.name,
      initials: row.initials,
      color: row.color,
      body,
      createdAt: new Date(row.created_at).toISOString(),
    },
  };
}

export interface Teammate {
  id: string;
  name: string;
  initials: string;
  color: string;
  level: number;
  /** Birlikte kadroda olunan maç sayısı */
  together: number;
}

/** Oyuncunun en az bir maçta aynı kadroda olduğu oyuncular ("Kişiler" sekmesi) */
export async function listTeammates(playerId: string): Promise<Teammate[]> {
  const db = await getDb();
  return db.query<Teammate>(
    `SELECT p.id, p.name, p.initials, p.color, p.level, count(DISTINCT a.match_id)::int AS together
     FROM match_participants a
     JOIN match_participants b ON b.match_id = a.match_id AND b.player_id <> a.player_id
     JOIN players p ON p.id = b.player_id
     WHERE a.player_id = $1
     GROUP BY p.id ORDER BY together DESC, p.name`,
    [playerId],
  );
}
