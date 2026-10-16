import "server-only";
import { getDb } from "./db";
import { SPORT_LABELS, type Sport } from "./types";

/*
 * Dashboard sorguları: user_events tablosundaki kullanıcı davranışlarından istatistik üretir.
 * Tüm hesaplamalar veritabanında (SQL) yapılır; tarayıcıya yalnızca sonuç gider.
 */

const TZ = "Europe/Istanbul";

export const EVENT_LABELS: Record<string, string> = {
  user_registered: "Kayıt",
  user_logged_in: "Giriş",
  match_created: "Maç oluşturma",
  match_joined: "Maça katılma",
  match_left: "Maçtan ayrılma",
  match_reviewed: "Maç değerlendirme",
};

export interface DashboardData {
  kpis: { registered: number; active7d: number; openMatches: number; avgFill: number; events7d: number };
  daily: { day: string; events: number; users: number }[];
  byType: { type: string; label: string; count: number }[];
  funnel: { label: string; count: number }[];
  bySport: { sport: Sport; label: string; matches: number; avgFill: number }[];
  recent: { id: string; type: string; label: string; player: string; match: string | null; at: string }[];
}

export async function getDashboard(): Promise<DashboardData> {
  const db = await getDb();

  const [kpis] = await db.query<DashboardData["kpis"]>(
    `SELECT
       (SELECT count(*)::int FROM players WHERE email IS NOT NULL)                                       AS registered,
       (SELECT count(DISTINCT player_id)::int FROM user_events WHERE created_at > now() - interval '7 days') AS "active7d",
       (SELECT count(*)::int FROM matches WHERE starts_at > now())                                       AS "openMatches",
       (SELECT count(*)::int FROM user_events WHERE created_at > now() - interval '7 days')              AS "events7d",
       COALESCE((SELECT round(avg(fill) * 100)::int FROM (
          SELECT (SELECT count(*) FROM match_participants mp WHERE mp.match_id = m.id)::float / m.capacity AS fill
          FROM matches m WHERE m.starts_at > now()) f), 0)                                             AS "avgFill"`,
  );

  // Son 14 gün, olay olmayan günler de 0 olarak gelsin diye generate_series ile
  const daily = await db.query<{ day: string; events: number; users: number }>(
    `WITH days AS (
       SELECT generate_series((now() AT TIME ZONE '${TZ}')::date - 13, (now() AT TIME ZONE '${TZ}')::date, interval '1 day')::date AS day
     )
     SELECT to_char(d.day, 'YYYY-MM-DD') AS day,
            count(e.id)::int AS events,
            count(DISTINCT e.player_id)::int AS users
     FROM days d
     LEFT JOIN user_events e ON (e.created_at AT TIME ZONE '${TZ}')::date = d.day
     GROUP BY d.day ORDER BY d.day`,
  );

  const byType = await db.query<{ type: string; count: number }>(
    "SELECT type, count(*)::int AS count FROM user_events GROUP BY type ORDER BY count DESC",
  );

  // Dönüşüm hunisi: kayıt olan kullanıcıların kaçı maça katıldı, kaçı maç organize etti
  const [funnel] = await db.query<{ registered: number; joined: number; organized: number }>(
    `SELECT
       count(*)::int AS registered,
       count(*) FILTER (WHERE EXISTS (
         SELECT 1 FROM match_participants mp JOIN matches m ON m.id = mp.match_id
         WHERE mp.player_id = p.id AND m.organizer_id <> p.id))::int AS joined,
       count(*) FILTER (WHERE EXISTS (SELECT 1 FROM matches m WHERE m.organizer_id = p.id))::int AS organized
     FROM players p WHERE p.email IS NOT NULL`,
  );

  const bySport = await db.query<{ sport: Sport; matches: number; avg_fill: number }>(
    `SELECT m.sport, count(*)::int AS matches,
            round(avg((SELECT count(*) FROM match_participants mp WHERE mp.match_id = m.id)::float / m.capacity) * 100)::int AS avg_fill
     FROM matches m GROUP BY m.sport ORDER BY matches DESC`,
  );

  const recent = await db.query<{ id: string; type: string; player: string | null; match: string | null; at: Date }>(
    `SELECT e.id::text, e.type, p.name AS player, m.title AS match, e.created_at AS at
     FROM user_events e
     LEFT JOIN players p ON p.id = e.player_id
     LEFT JOIN matches m ON m.id = e.match_id
     ORDER BY e.created_at DESC LIMIT 12`,
  );

  return {
    kpis,
    daily,
    byType: byType.map((r) => ({ ...r, label: EVENT_LABELS[r.type] ?? r.type })),
    funnel: [
      { label: "Kayıt oldu", count: funnel.registered },
      { label: "Bir maça katıldı", count: funnel.joined },
      { label: "Maç organize etti", count: funnel.organized },
    ],
    bySport: bySport.map((r) => ({ sport: r.sport, label: SPORT_LABELS[r.sport] ?? r.sport, matches: r.matches, avgFill: r.avg_fill })),
    recent: recent.map((r) => ({
      id: r.id,
      type: r.type,
      label: EVENT_LABELS[r.type] ?? r.type,
      player: r.player ?? "Silinmiş oyuncu",
      match: r.match,
      at: new Date(r.at).toISOString(),
    })),
  };
}
