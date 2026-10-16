import "server-only";
import type { Viewer } from "./auth";
import type { PlayerStats } from "./badges";
import { getDb } from "./db";
import { XP_REWARDS, reliabilityScore } from "./gamification";
import { currentUser, getVenue } from "./mock-data";

export interface Profile {
  id: string;
  name: string;
  initials: string;
  color: string;
  role: string;
  city: string;
  totalXp: number;
  reliability: number;
  mvpAwards: number;
  stats: PlayerStats;
  /** Radar grafiği; takım arkadaşlarından değerlendirme gelmeden boş */
  attributes: { label: string; value: number }[] | null;
  recentMatch: { id: string; title: string; format: string; venueShort: string } | null;
}

/**
 * Profil ekranının verisi.
 * Kayıtlı oyuncularda istatistikler veritabanındaki gerçek katılımlardan hesaplanır.
 * Demo oyuncu (Atahan) Figma tasarımındaki zengin örnek profili gösterir.
 */
export async function getProfile(viewer: Viewer): Promise<Profile> {
  if (viewer.id === currentUser.id) {
    return {
      ...viewer,
      role: currentUser.role,
      city: currentUser.city,
      totalXp: currentUser.totalXp,
      reliability: currentUser.rating,
      mvpAwards: currentUser.mvpAwards,
      stats: currentUser.stats,
      attributes: currentUser.attributes,
      recentMatch: { ...currentUser.recentMatch, venueShort: "Sentetik Saha" },
    };
  }

  const db = await getDb();
  const [row] = await db.query<{ played: number; joined: number; organized: number; venues: number; sports: number; rated: number }>(
    `SELECT
       count(*) FILTER (WHERE m.starts_at < now())::int                       AS played,
       count(*)::int                                                          AS joined,
       (SELECT count(*)::int FROM matches WHERE organizer_id = $1)            AS organized,
       count(DISTINCT m.venue_id) FILTER (WHERE m.starts_at < now())::int     AS venues,
       count(DISTINCT m.sport) FILTER (WHERE m.starts_at < now())::int        AS sports,
       0                                                                      AS rated
     FROM match_participants mp JOIN matches m ON m.id = mp.match_id
     WHERE mp.player_id = $1`,
    [viewer.id],
  );
  const [recent] = await db.query<{ id: string; title: string; format: string; venue_id: string }>(
    `SELECT m.id, m.title, m.format, m.venue_id FROM match_participants mp JOIN matches m ON m.id = mp.match_id
     WHERE mp.player_id = $1 AND m.starts_at < now() ORDER BY m.starts_at DESC LIMIT 1`,
    [viewer.id],
  );

  const stats: PlayerStats = {
    matchesPlayed: row.played,
    onTimeStreak: 0,
    sosAnswered: 0,
    ratingsGiven: row.rated,
    matchesOrganized: row.organized,
    venuesVisited: row.venues,
    sportsPlayed: row.sports,
    mvpAwards: 0,
  };

  return {
    ...viewer,
    role: row.played === 0 ? "Yeni Oyuncu" : "Oyuncu",
    city: "Kahramanmaraş",
    totalXp: row.played * XP_REWARDS.matchAttended,
    // Gelme oyları henüz yok: oynanan maçlara gelmiş sayılır (nötr başlangıç ile)
    reliability: reliabilityScore(row.played, row.played),
    mvpAwards: 0,
    stats,
    attributes: null,
    recentMatch: recent ? { id: recent.id, title: recent.title, format: recent.format, venueShort: getVenue(recent.venue_id)?.shortName ?? "" } : null,
  };
}

/** Oyuncunun organize ettiği maç sayısı (Maç Oluştur ekranındaki mesaj için) */
export async function countOrganized(playerId: string): Promise<number> {
  const db = await getDb();
  const [row] = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM matches WHERE organizer_id = $1", [playerId]);
  return row.n;
}
