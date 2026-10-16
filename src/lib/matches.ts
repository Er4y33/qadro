import "server-only";
import { getDb } from "./db";
import { getVenue } from "./mock-data";
import { capacityFor, isSport } from "./sports";
import type { LineupSlot, Match, Player, Sport } from "./types";

/*
 * Maç verisine erişen tüm fonksiyonlar burada. Sayfalar ve API rotaları SQL yazmaz, bu fonksiyonları çağırır.
 */

const TZ = "Europe/Istanbul";

interface MatchRow {
  id: string;
  venue_id: string;
  title: string;
  sport: Sport;
  format: string;
  starts_at: Date;
  price: number;
  capacity: number;
  min_level: number;
  is_public: boolean;
  note: string;
  organizer_id: string;
}

interface ParticipantRow extends PlayerRow {
  match_id: string;
  position: string | null;
  x: number | null;
  y: number | null;
}

interface PlayerRow {
  id: string;
  name: string;
  initials: string;
  color: string;
  level: number;
  rating: number;
  overall: number;
}

const toPlayer = (r: PlayerRow): Player => ({
  id: r.id,
  name: r.name,
  initials: r.initials,
  color: r.color,
  level: r.level,
  rating: r.rating,
});

/** Türkiye saatine göre takvim günü (YYYY-MM-DD) */
const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);

export function dayLabel(startsAt: Date, now = new Date()): string {
  const diffDays = Math.round((Date.parse(dayKey(startsAt)) - Date.parse(dayKey(now))) / 86_400_000);
  if (diffDays === 0) return "Bugün";
  if (diffDays === 1) return "Yarın";
  if (diffDays > 1 && diffDays < 7) return new Intl.DateTimeFormat("tr-TR", { timeZone: TZ, weekday: "long" }).format(startsAt);
  return new Intl.DateTimeFormat("tr-TR", { timeZone: TZ, day: "numeric", month: "short" }).format(startsAt);
}

const timeLabel = (d: Date) => new Intl.DateTimeFormat("tr-TR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(d);

function toMatch(row: MatchRow, participants: ParticipantRow[], organizer: PlayerRow): Match {
  const venue = getVenue(row.venue_id);
  const startsAt = new Date(row.starts_at);
  const hoursLeft = (startsAt.getTime() - Date.now()) / 3_600_000;
  const lineup: LineupSlot[] = participants
    .filter((p) => p.position && p.x !== null && p.y !== null)
    .map((p) => ({ player: toPlayer(p), position: p.position!, overall: p.overall, x: p.x!, y: p.y! }));

  return {
    id: row.id,
    venueId: row.venue_id,
    title: row.title,
    sport: row.sport,
    format: row.format,
    venue: venue?.name ?? "Bilinmeyen saha",
    venueShort: venue?.shortName ?? "Saha",
    startsAt: startsAt.toISOString(),
    dayLabel: dayLabel(startsAt),
    time: timeLabel(startsAt),
    isPublic: row.is_public,
    pricePerPerson: row.price,
    capacity: row.capacity,
    joined: participants.length,
    tag: hoursLeft < 24 && participants.length < row.capacity ? "acil" : "yeni",
    minLevel: row.min_level,
    organizer: toPlayer(organizer),
    participants: participants.map(toPlayer),
    lineup,
    note: row.note,
  };
}

const PARTICIPANT_SELECT = `
  SELECT mp.match_id, mp.position, mp.x, mp.y, p.id, p.name, p.initials, p.color, p.level, p.rating, p.overall
  FROM match_participants mp JOIN players p ON p.id = mp.player_id`;

async function hydrate(rows: MatchRow[], participantRows: ParticipantRow[]): Promise<Match[]> {
  if (rows.length === 0) return [];
  const db = await getDb();
  const players = await db.query<PlayerRow>("SELECT id, name, initials, color, level, rating, overall FROM players");
  const byId = new Map(players.map((p) => [p.id, p]));
  return rows.map((row) =>
    toMatch(
      row,
      participantRows.filter((p) => p.match_id === row.id),
      byId.get(row.organizer_id)!,
    ),
  );
}

/**
 * Akışta görünen maçlar: herkese açık olanlar + oyuncunun organizatörü ya da katılımcısı olduğu gizli maçlar.
 * Başlamasının üzerinden 3 saatten fazla geçen maçlar listelenmez.
 */
export async function listMatches(viewerId: string): Promise<Match[]> {
  const db = await getDb();
  const visible = `
    m.starts_at > now() - interval '3 hours'
    AND (m.is_public OR m.organizer_id = $1
         OR EXISTS (SELECT 1 FROM match_participants x WHERE x.match_id = m.id AND x.player_id = $1))`;
  const rows = await db.query<MatchRow>(`SELECT m.* FROM matches m WHERE ${visible} ORDER BY m.starts_at`, [viewerId]);
  const participants = await db.query<ParticipantRow>(
    `${PARTICIPANT_SELECT} JOIN matches m ON m.id = mp.match_id WHERE ${visible} ORDER BY mp.joined_at`,
    [viewerId],
  );
  return hydrate(rows, participants);
}

export async function getMatch(id: string): Promise<Match | null> {
  const db = await getDb();
  const rows = await db.query<MatchRow>("SELECT * FROM matches WHERE id = $1", [id]);
  if (rows.length === 0) return null;
  const participants = await db.query<ParticipantRow>(`${PARTICIPANT_SELECT} WHERE mp.match_id = $1 ORDER BY mp.joined_at`, [id]);
  const [match] = await hydrate(rows, participants);
  return match;
}

/* ───────────── Yazma işlemleri ───────────── */

export interface CreateMatchInput {
  title: string;
  sport: Sport;
  format: string;
  venueId: string;
  startsAt: string;
  price: number;
  minLevel: number;
  isPublic: boolean;
  note: string;
}

/** İstek gövdesini doğrular. Hata varsa Türkçe mesaj listesi döner (API bunu 400 ile iletir). */
export function validateCreateMatch(body: unknown): { ok: true; value: CreateMatchInput } | { ok: false; errors: string[] } {
  const b = (body ?? {}) as Record<string, unknown>;
  const errors: string[] = [];

  const title = typeof b.title === "string" ? b.title.trim() : "";
  if (title.length < 3 || title.length > 60) errors.push("Başlık 3–60 karakter olmalı.");

  const sport = b.sport;
  if (!isSport(sport)) errors.push("Geçersiz branş.");

  const format = typeof b.format === "string" ? b.format : "";
  if (isSport(sport) && !capacityFor(sport, format)) errors.push("Bu branş için geçersiz format.");

  const venueId = typeof b.venueId === "string" ? b.venueId : "";
  const venue = getVenue(venueId);
  if (!venue) errors.push("Saha bulunamadı.");
  else if (isSport(sport) && !venue.sports.includes(sport)) errors.push("Bu sahada seçilen branş oynanamıyor.");

  const startsAt = typeof b.startsAt === "string" ? new Date(b.startsAt) : new Date(NaN);
  if (Number.isNaN(startsAt.getTime())) errors.push("Geçersiz tarih.");
  else if (startsAt.getTime() < Date.now() - 5 * 60_000) errors.push("Geçmiş bir saate maç oluşturulamaz.");

  const price = Number(b.price);
  if (!Number.isInteger(price) || price < 0 || price > 10_000) errors.push("Ücret 0–10.000 ₺ arasında olmalı.");

  const minLevel = Number(b.minLevel);
  if (!Number.isInteger(minLevel) || minLevel < 1 || minLevel > 100) errors.push("Minimum seviye 1–100 arasında olmalı.");

  const note = typeof b.note === "string" ? b.note.trim() : "";
  if (note.length > 300) errors.push("Not en fazla 300 karakter olabilir.");

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      title,
      sport: sport as Sport,
      format,
      venueId,
      startsAt: startsAt.toISOString(),
      price,
      minLevel,
      isPublic: b.isPublic !== false,
      note,
    },
  };
}

/** "Cumartesi Akşamı Tenis" → "cumartesi-aksami-tenis-x7k2" */
function slugify(text: string): string {
  const map: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" };
  const base = text
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıöşü]/g, (c) => map[c])
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${base || "mac"}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function createMatch(input: CreateMatchInput, organizerId: string): Promise<string> {
  const db = await getDb();
  const id = slugify(input.title);
  const capacity = capacityFor(input.sport, input.format)!;
  await db.query(
    `INSERT INTO matches (id, venue_id, title, sport, format, starts_at, price, capacity, min_level, is_public, note, organizer_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [id, input.venueId, input.title, input.sport, input.format, input.startsAt, input.price, capacity, input.minLevel, input.isPublic, input.note, organizerId],
  );
  // Organizatör maçın ilk oyuncusudur
  await db.query("INSERT INTO match_participants (match_id, player_id) VALUES ($1, $2)", [id, organizerId]);
  await logEvent(organizerId, "match_created", id, { sport: input.sport, format: input.format, isPublic: input.isPublic });
  return id;
}

export type JoinResult = "joined" | "not_found" | "full" | "already_joined";

/**
 * Maça katılır. Kontenjan kontrolü ile ekleme tek SQL cümlesinde yapılır;
 * böylece iki kişi aynı anda son boş yere tıklarsa yalnızca biri girebilir.
 */
export async function joinMatch(matchId: string, playerId: string, slot?: { position: string; x: number; y: number }): Promise<JoinResult> {
  const db = await getDb();
  const inserted = await db.query(
    `INSERT INTO match_participants (match_id, player_id, position, x, y)
     SELECT m.id, $2, $3, $4, $5 FROM matches m
     WHERE m.id = $1
       AND (SELECT count(*) FROM match_participants WHERE match_id = m.id) < m.capacity
     ON CONFLICT (match_id, player_id) DO NOTHING
     RETURNING match_id`,
    [matchId, playerId, slot?.position ?? null, slot?.x ?? null, slot?.y ?? null],
  );
  if (inserted.length > 0) {
    await logEvent(playerId, "match_joined", matchId, slot ? { position: slot.position } : {});
    return "joined";
  }
  // Neden eklenemediğini bul
  const [state] = await db.query<{ exists: boolean; member: boolean }>(
    `SELECT EXISTS (SELECT 1 FROM matches WHERE id = $1) AS exists,
            EXISTS (SELECT 1 FROM match_participants WHERE match_id = $1 AND player_id = $2) AS member`,
    [matchId, playerId],
  );
  if (!state.exists) return "not_found";
  if (state.member) return "already_joined";
  return "full";
}

export type LeaveResult = "left" | "not_found" | "not_member" | "organizer";

export async function leaveMatch(matchId: string, playerId: string): Promise<LeaveResult> {
  const db = await getDb();
  const [match] = await db.query<{ organizer_id: string }>("SELECT organizer_id FROM matches WHERE id = $1", [matchId]);
  if (!match) return "not_found";
  if (match.organizer_id === playerId) return "organizer";
  const deleted = await db.query("DELETE FROM match_participants WHERE match_id = $1 AND player_id = $2 RETURNING player_id", [matchId, playerId]);
  if (deleted.length === 0) return "not_member";
  await logEvent(playerId, "match_left", matchId);
  return "left";
}

/** Kullanıcı davranışını kaydeder (dashboard için) */
export async function logEvent(playerId: string | null, type: string, matchId?: string, payload: Record<string, unknown> = {}) {
  const db = await getDb();
  await db.query("INSERT INTO user_events (player_id, type, match_id, payload) VALUES ($1, $2, $3, $4)", [
    playerId,
    type,
    matchId ?? null,
    JSON.stringify(payload),
  ]);
}
