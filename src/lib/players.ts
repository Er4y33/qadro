import "server-only";
import type { PlayerStats } from "./badges";
import { getDb } from "./db";
import { daysLeft, levelFromXp, playerAttributes, XP_REWARDS, type Streak } from "./gamification";
import { countMvpAwards, countSosAnswered, getSeasonStandings, getStreak } from "./progress";
import { getReputation, type Reputation } from "./reviews";
import { getVenue } from "./venues";

/** Profili gösterilecek oyuncunun temel bilgisi (oturumdaki kullanıcı ya da başka bir oyuncu) */
export interface PlayerBase {
  id: string;
  name: string;
  initials: string;
  color: string;
  level: number;
}

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
  /** Son oynanan maçlar (en yeni başta, en fazla 5) */
  recentMatches: { id: string; title: string; format: string; venueShort: string; startsAt: string; reviewed: boolean }[];
  /** Oynanmış ama takım arkadaşlarının oylarıyla henüz onaylanmamış maçlar (XP'leri beklemede) */
  pendingMatches: number;
  streak: Streak;
  season: { name: string; daysLeft: number; xp: number; rank: number | null; players: number };
}

/** Rol etiketi: oyuncunun en çok yaptığı şeyden türetilir (organizatörlük, MVP, maç sayısı) */
function roleOf(played: number, organized: number, mvp: number): string {
  if (played === 0) return "Yeni Oyuncu";
  if (organized >= 3) return "Oyun Kurucu";
  if (mvp >= 2) return "Maçın Yıldızı";
  if (played >= 5) return "Sahanın Müdavimi";
  return "Oyuncu";
}

/**
 * Profil ekranının verisi. Tüm sayılar veritabanındaki gerçek katılım, değerlendirme, MVP ve S.O.S kayıtlarından
 * hesaplanır; demo hesabı (Atahan) dahil hiçbir oyuncu için sabit örnek değer kullanılmaz.
 */
export async function getProfile(player: PlayerBase): Promise<Profile> {
  const db = await getDb();
  const [reputation, streak, standings, sosAnswered, mvpAwards] = await Promise.all([
    getReputation(player.id),
    getStreak(player.id),
    getSeasonStandings(),
    countSosAnswered(player.id),
    countMvpAwards(player.id),
  ]);

  const recent = await db.query<{ id: string; title: string; format: string; venue_id: string; starts_at: Date; reviewed: boolean }>(
    `SELECT m.id, m.title, m.format, m.venue_id, m.starts_at,
            EXISTS (SELECT 1 FROM match_reviews r WHERE r.match_id = m.id AND r.reviewer_id = $1) AS reviewed
     FROM match_participants mp JOIN matches m ON m.id = mp.match_id
     WHERE mp.player_id = $1 AND m.starts_at < now() ORDER BY m.starts_at DESC LIMIT 5`,
    [player.id],
  );
  const recentMatches = recent.map((r) => ({
    id: r.id,
    title: r.title,
    format: r.format,
    venueShort: getVenue(r.venue_id)?.shortName ?? "",
    startsAt: new Date(r.starts_at).toISOString(),
    reviewed: r.reviewed,
  }));

  const [row] = await db.query<{ organized: number; venues: number; sports: number }>(
    `SELECT
       (SELECT count(*)::int FROM matches WHERE organizer_id = $1)            AS organized,
       count(DISTINCT m.venue_id) FILTER (WHERE m.starts_at < now())::int     AS venues,
       count(DISTINCT m.sport) FILTER (WHERE m.starts_at < now())::int        AS sports
     FROM match_participants mp JOIN matches m ON m.id = mp.match_id
     WHERE mp.player_id = $1`,
    [player.id],
  );

  // Sahte maç engeli: yalnızca takım arkadaşlarının oylarıyla onaylanan maçlar oynanmış sayılır ve XP kazandırır
  const played = reputation.confirmed;
  const stats: PlayerStats = {
    matchesPlayed: played,
    onTimeStreak: reputation.onTimeStreak,
    sosAnswered,
    ratingsGiven: reputation.ratingsGiven,
    matchesOrganized: row.organized,
    venuesVisited: row.venues,
    sportsPlayed: row.sports,
    mvpAwards,
  };
  const totalXp =
    played * XP_REWARDS.matchAttended +
    reputation.onTime * XP_REWARDS.onTime +
    reputation.reviewsGiven * XP_REWARDS.ratedOthers +
    sosAnswered * XP_REWARDS.sosAnswered +
    mvpAwards * XP_REWARDS.mvp;

  // Kayıtlı seviye ve puan, hesaplanan değerlerle eşitlenir: maç kartlarındaki "Lvl. • Yıldız" ve "Seviyeme uygun" filtresi bunları okur
  const level = levelFromXp(totalXp).level;
  await db.query("UPDATE players SET level = $2, rating = $3 WHERE id = $1 AND (level <> $2 OR rating <> $3)", [player.id, level, reputation.reliability]);

  const mine = standings.entries.find((e) => e.playerId === player.id);
  return {
    id: player.id,
    name: player.name,
    initials: player.initials,
    color: player.color,
    role: roleOf(played, row.organized, mvpAwards),
    city: "Kahramanmaraş",
    totalXp,
    reliability: reputation.reliability,
    mvpAwards,
    stats,
    attributes: playerAttributes({
      praises: reputation.praises,
      attendedVotes: reputation.attendedVotes,
      confirmed: reputation.confirmed,
      onTime: reputation.onTime,
      reliability: reputation.reliability,
    }),
    praises: reputation.praises,
    noShows: reputation.noShows,
    recentMatch: recentMatches[0] ?? null,
    recentMatches,
    pendingMatches: reputation.pending,
    streak,
    season: {
      name: standings.season.name,
      daysLeft: daysLeft(standings.season),
      xp: mine?.xp ?? 0,
      rank: mine?.rank ?? null,
      players: standings.entries.length,
    },
  };
}

/** Herkese açık oyuncu profili için temel bilgi (yoksa null → 404) */
export async function getPlayer(id: string): Promise<PlayerBase | null> {
  const db = await getDb();
  const [row] = await db.query<PlayerBase>("SELECT id, name, initials, color, level FROM players WHERE id = $1", [id]);
  return row ?? null;
}

/** Oyuncunun organize ettiği maç sayısı (Maç Oluştur ekranındaki mesaj için) */
export async function countOrganized(playerId: string): Promise<number> {
  const db = await getDb();
  const [row] = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM matches WHERE organizer_id = $1", [playerId]);
  return row.n;
}
