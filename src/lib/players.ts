import "server-only";
import type { Viewer } from "./auth";
import type { PlayerStats } from "./badges";
import { getDb } from "./db";
import { XP_REWARDS } from "./gamification";
import { getReputation, type Reputation } from "./reviews";
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
  /** Takım arkadaşlarından alınan övgüler (sayılarıyla) */
  praises: Reputation["praises"];
  /** Çoğunluk oyuyla "gelmedi" sayıldığı maç sayısı */
  noShows: number;
  recentMatch: { id: string; title: string; format: string; venueShort: string; reviewed: boolean } | null;
}

/**
 * Profil ekranının verisi.
 * Kayıtlı oyuncularda istatistikler veritabanındaki gerçek katılım ve değerlendirmelerden hesaplanır.
 * Demo oyuncu (Atahan) Figma'daki zengin örnek profili korur; övgüler, son maç ve verdiği
 * değerlendirmeler ise onda da veritabanından gelir.
 */
export async function getProfile(viewer: Viewer): Promise<Profile> {
  const db = await getDb();
  const reputation = await getReputation(viewer.id);

  const [recent] = await db.query<{ id: string; title: string; format: string; venue_id: string; reviewed: boolean }>(
    `SELECT m.id, m.title, m.format, m.venue_id,
            EXISTS (SELECT 1 FROM match_reviews r WHERE r.match_id = m.id AND r.reviewer_id = $1) AS reviewed
     FROM match_participants mp JOIN matches m ON m.id = mp.match_id
     WHERE mp.player_id = $1 AND m.starts_at < now() ORDER BY m.starts_at DESC LIMIT 1`,
    [viewer.id],
  );
  const recentMatch = recent
    ? { id: recent.id, title: recent.title, format: recent.format, venueShort: getVenue(recent.venue_id)?.shortName ?? "", reviewed: recent.reviewed }
    : null;

  if (viewer.id === currentUser.id) {
    return {
      ...viewer,
      role: currentUser.role,
      city: currentUser.city,
      totalXp: currentUser.totalXp + reputation.reviewsGiven * XP_REWARDS.ratedOthers,
      reliability: currentUser.rating,
      mvpAwards: currentUser.mvpAwards,
      stats: { ...currentUser.stats, ratingsGiven: currentUser.stats.ratingsGiven + reputation.ratingsGiven },
      attributes: currentUser.attributes,
      praises: reputation.praises,
      noShows: reputation.noShows,
      recentMatch,
    };
  }

  const [row] = await db.query<{ organized: number; venues: number; sports: number }>(
    `SELECT
       (SELECT count(*)::int FROM matches WHERE organizer_id = $1)            AS organized,
       count(DISTINCT m.venue_id) FILTER (WHERE m.starts_at < now())::int     AS venues,
       count(DISTINCT m.sport) FILTER (WHERE m.starts_at < now())::int        AS sports
     FROM match_participants mp JOIN matches m ON m.id = mp.match_id
     WHERE mp.player_id = $1`,
    [viewer.id],
  );

  // Çoğunluk oyuyla "gelmedi" sayılan maçlar oynanmış sayılmaz
  const played = reputation.pastMatches - reputation.noShows;
  const stats: PlayerStats = {
    matchesPlayed: played,
    onTimeStreak: 0,
    sosAnswered: 0,
    ratingsGiven: reputation.ratingsGiven,
    matchesOrganized: row.organized,
    venuesVisited: row.venues,
    sportsPlayed: row.sports,
    mvpAwards: 0,
  };

  return {
    ...viewer,
    role: played === 0 ? "Yeni Oyuncu" : "Oyuncu",
    city: "Kahramanmaraş",
    totalXp: played * XP_REWARDS.matchAttended + reputation.reviewsGiven * XP_REWARDS.ratedOthers,
    reliability: reputation.reliability,
    mvpAwards: 0,
    stats,
    attributes: null,
    praises: reputation.praises,
    noShows: reputation.noShows,
    recentMatch,
  };
}

/** Oyuncunun organize ettiği maç sayısı (Maç Oluştur ekranındaki mesaj için) */
export async function countOrganized(playerId: string): Promise<number> {
  const db = await getDb();
  const [row] = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM matches WHERE organizer_id = $1", [playerId]);
  return row.n;
}
