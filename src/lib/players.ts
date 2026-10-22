import "server-only";
import type { Viewer } from "./auth";
import type { PlayerStats } from "./badges";
import { getDb } from "./db";
import { daysLeft, XP_REWARDS, type Streak } from "./gamification";
import { countMvpAwards, countSosAnswered, getSeasonStandings, getStreak } from "./progress";
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
  /** Oynanmış ama takım arkadaşlarının oylarıyla henüz onaylanmamış maçlar (XP'leri beklemede) */
  pendingMatches: number;
  streak: Streak;
  season: { name: string; daysLeft: number; xp: number; rank: number | null; players: number };
}

/**
 * Profil ekranının verisi.
 * Kayıtlı oyuncularda istatistikler veritabanındaki gerçek katılım ve değerlendirmelerden hesaplanır.
 * Demo oyuncu (Atahan) Figma'daki zengin örnek profili korur (42 maç, 12 MVP…); üzerine veritabanındaki
 * gerçek etkinlikleri eklenir: verdiği değerlendirmeler, yanıtladığı S.O.S çağrıları, kazandığı MVP'ler,
 * övgüler, haftalık seri ve sezon XP'si.
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
  const [streak, standings, sosAnswered, mvpAwards] = await Promise.all([
    getStreak(viewer.id),
    getSeasonStandings(),
    countSosAnswered(viewer.id),
    countMvpAwards(viewer.id),
  ]);
  const mine = standings.entries.find((e) => e.playerId === viewer.id);
  const season = {
    name: standings.season.name,
    daysLeft: daysLeft(standings.season),
    xp: mine?.xp ?? 0,
    rank: mine?.rank ?? null,
    players: standings.entries.length,
  };
  /** Veritabanından gelen, XP kazandıran etkinlikler (maçlar hariç) */
  const extraXp =
    reputation.reviewsGiven * XP_REWARDS.ratedOthers + sosAnswered * XP_REWARDS.sosAnswered + mvpAwards * XP_REWARDS.mvp;

  const recentMatch = recent
    ? { id: recent.id, title: recent.title, format: recent.format, venueShort: getVenue(recent.venue_id)?.shortName ?? "", reviewed: recent.reviewed }
    : null;

  if (viewer.id === currentUser.id) {
    return {
      ...viewer,
      role: currentUser.role,
      city: currentUser.city,
      totalXp: currentUser.totalXp + extraXp,
      reliability: currentUser.rating,
      mvpAwards: currentUser.mvpAwards + mvpAwards,
      stats: {
        ...currentUser.stats,
        ratingsGiven: currentUser.stats.ratingsGiven + reputation.ratingsGiven,
        sosAnswered: currentUser.stats.sosAnswered + sosAnswered,
        mvpAwards: currentUser.stats.mvpAwards + mvpAwards,
      },
      attributes: currentUser.attributes,
      praises: reputation.praises,
      noShows: reputation.noShows,
      recentMatch,
      pendingMatches: reputation.pending,
      streak,
      season,
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

  // Sahte maç engeli: yalnızca takım arkadaşlarının oylarıyla onaylanan maçlar oynanmış sayılır ve XP kazandırır
  const played = reputation.confirmed;
  const stats: PlayerStats = {
    matchesPlayed: played,
    onTimeStreak: 0,
    sosAnswered,
    ratingsGiven: reputation.ratingsGiven,
    matchesOrganized: row.organized,
    venuesVisited: row.venues,
    sportsPlayed: row.sports,
    mvpAwards,
  };

  return {
    ...viewer,
    role: played === 0 ? "Yeni Oyuncu" : "Oyuncu",
    city: "Kahramanmaraş",
    totalXp: played * XP_REWARDS.matchAttended + extraXp,
    reliability: reputation.reliability,
    mvpAwards,
    stats,
    attributes: null,
    praises: reputation.praises,
    noShows: reputation.noShows,
    recentMatch,
    pendingMatches: reputation.pending,
    streak,
    season,
  };
}

/** Oyuncunun organize ettiği maç sayısı (Maç Oluştur ekranındaki mesaj için) */
export async function countOrganized(playerId: string): Promise<number> {
  const db = await getDb();
  const [row] = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM matches WHERE organizer_id = $1", [playerId]);
  return row.n;
}
