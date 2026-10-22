import "server-only";
import { getDb } from "./db";

/*
 * Rehberli demo turu için örnek veri.
 *
 * "Demoyu Başlat" her basıldığında yalnızca kimliği "demo-" ile başlayan maçlar silinip şimdiki zamana göre
 * yeniden oluşturulur (katılımlar, oylar, MVP oyları ve S.O.S çağrıları maçla birlikte silinir).
 * Gerçek kullanıcıların maçlarına ve verilerine dokunulmaz.
 *
 * Kurulan senaryo (demo oyuncusu: Atahan):
 * - Son 3 haftanın maçları: katılımı oylarla onaylı → haftalık seri ve sezon XP'si dolu görünür.
 * - "demo-son-mac": 4 saat önce oynanmış (ana sayfa akışında görünmez), Atahan henüz değerlendirmemiş → Takımı Değerlendir + MVP.
 * - "demo-sos-mac": 3 saat sonra başlayacak, 1 kişi eksik, açık S.O.S çağrısı → Bildirimler'den kabul edilir.
 */

export const DEMO_PLAYER_ID = "atahan";
const HOUR = 3_600_000;

type Lineup = [player: string, position?: string, x?: number, y?: number][];

const SEVEN: Lineup = [
  ["atahan", "Snt", 50, 15],
  ["ahmet", "SolO", 22, 33],
  ["can", "SağO", 78, 33],
  ["emre", "OS", 50, 50],
  ["burak", "Stp", 28, 67],
  ["mert", "Stp", 72, 67],
  ["oguz", "Klc", 50, 88],
];

export async function resetDemo(now = new Date()) {
  const db = await getDb();
  await db.query("DELETE FROM matches WHERE id LIKE 'demo-%'");

  const insertMatch = async (m: {
    id: string;
    venue: string;
    title: string;
    format: string;
    startsAt: Date;
    capacity: number;
    organizer: string;
    note: string;
    lineup: Lineup;
  }) => {
    await db.query(
      `INSERT INTO matches (id, venue_id, title, sport, format, starts_at, price, capacity, min_level, organizer_id, note)
       VALUES ($1, $2, $3, 'futbol', $4, $5, 100, $6, 5, $7, $8)`,
      [m.id, m.venue, m.title, m.format, m.startsAt.toISOString(), m.capacity, m.organizer, m.note],
    );
    for (const [i, [player, position, x, y]] of m.lineup.entries()) {
      await db.query(
        `INSERT INTO match_participants (match_id, player_id, position, x, y, joined_at) VALUES ($1, $2, $3, $4, $5, $6)`,
        [m.id, player, position ?? null, x ?? null, y ?? null, new Date(m.startsAt.getTime() - (48 - i) * HOUR).toISOString()],
      );
    }
  };
  const review = (matchId: string, reviewer: string, target: string, attended: boolean, praise: string | null = null) =>
    db.query(
      "INSERT INTO match_reviews (match_id, reviewer_id, target_id, attended, praise_id) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING",
      [matchId, reviewer, target, attended, praise],
    );
  const mvpVote = (matchId: string, voter: string, target: string) =>
    db.query("INSERT INTO match_mvp_votes (match_id, voter_id, target_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", [matchId, voter, target]);

  // 1) Son üç haftanın maçları: herkesin katılımı 3 takım arkadaşının "Geldi" oyuyla onaylı
  const historyMvp = ["oguz", "can", "ahmet"];
  const praises = ["taktiksel", "dinamik", "kaya-gibi", "centilmen"];
  for (let week = 1; week <= 3; week++) {
    const id = `demo-gecmis-${week}`;
    await insertMatch({
      id,
      venue: week === 2 ? "kmaras-merkez" : "elbistan-sentetik",
      title: `${week} Hafta Önceki Maç`,
      format: "7v7",
      startsAt: new Date(now.getTime() - week * 7 * 24 * HOUR - HOUR),
      capacity: 14,
      organizer: "ahmet",
      note: "Demo turu için örnek geçmiş maç.",
      lineup: SEVEN,
    });
    const ids = SEVEN.map(([p]) => p);
    for (const [i, target] of ids.entries()) {
      for (let k = 1; k <= 3; k++) {
        const reviewer = ids[(i + k) % ids.length];
        await review(id, reviewer, target, true, k === 1 ? praises[(i + week) % praises.length] : null);
      }
    }
    const mvp = historyMvp[week - 1];
    const voters = ids.filter((p) => p !== mvp).slice(0, 2);
    for (const voter of voters) await mvpVote(id, voter, mvp);
  }

  // 2) Dört saat önce oynanmış, Atahan'ın değerlendireceği maç (akış, başlamasının üzerinden 3 saat geçen maçları göstermez)
  const last = "demo-son-mac";
  await insertMatch({
    id: last,
    venue: "elbistan-sentetik",
    title: "Bugünkü Halı Saha",
    format: "7v7",
    startsAt: new Date(now.getTime() - 4 * HOUR),
    capacity: 14,
    organizer: "ahmet",
    note: "Maç oynandı. Takım arkadaşlarını değerlendir, maçın oyuncusunu seç!",
    lineup: [...SEVEN, ["yusuf"]],
  });
  await review(last, "ahmet", "atahan", true, "taktiksel");
  await review(last, "can", "atahan", true, "dinamik");
  await review(last, "burak", "atahan", true, "kaya-gibi");
  // Yusuf için 3 "Gelmedi" oyu: çoğunluk kuralının işlediğini göstermek için
  await review(last, "ahmet", "yusuf", false);
  await review(last, "can", "yusuf", false);
  await review(last, "oguz", "yusuf", false);
  // MVP oyları: Oğuz 1, Can 1. Atahan'ın oyu kimi MVP yapacağını belirler (en az 2 oy ve tek başına önde olma kuralı)
  await mvpVote(last, "ahmet", "oguz");
  await mvpVote(last, "burak", "can");

  // 3) Kalecisi eksik yaklaşan maç ve açık S.O.S çağrısı
  const sos = "demo-sos-mac";
  const startsAt = new Date(now.getTime() + 3 * HOUR);
  await insertMatch({
    id: sos,
    venue: "kmaras-merkez",
    title: "Kalecisi Eksik 5'li Maç",
    format: "5v5",
    startsAt,
    capacity: 10,
    organizer: "mert",
    note: "Kalecimiz son dakika iptal etti. Kaleye geçecek biri lazım!",
    lineup: [["mert"], ["ahmet"], ["can"], ["burak"], ["emre"], ["yusuf"], ["kerem"], ["baris"], ["serkan"]],
  });
  await db.query(
    "INSERT INTO sos_calls (match_id, position, created_by, created_at, expires_at) VALUES ($1, 'Kaleci', 'mert', $2, $3)",
    [sos, new Date(now.getTime() - 4 * 60_000).toISOString(), startsAt.toISOString()],
  );
}
