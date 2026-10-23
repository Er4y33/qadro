import type { Db } from "./index";

/**
 * Örnek maç geçmişi: son 8 haftada oynanmış 8 maç, takım arkadaşlarının oyları, övgüler ve MVP oyları.
 *
 * Neden var? Liderlik tablosu, güvenilirlik, haftalık seri, sezon sıralaması ve oyuncu özellikleri grafiği
 * gerçek oylardan hesaplanır. Boş bir veritabanında bunların hepsi sıfır görünürdü. Bu geçmiş, kodun
 * HESAPLAMASINA dokunmadan, hesaplanacak örnek oyları ekler; sayılar yine aynı SQL ve kurallarla üretilir.
 *
 * Kurallar (gamification.ts) bilinçli olarak sınanır:
 * - Onur birkaç maça gelmedi: en az 3 "Gelmedi" oyuyla güvenilirliği düşer.
 * - Burak iki maçta geç kaldı: o maçlarda "zamanında gelme" XP'si almaz.
 * - Atahan (demo hesabı) hiçbir maçı değerlendirmemiştir: demo turunda değerlendirmeyi kendisi yapabilir.
 *
 * Tarihler seed anına göre hesaplanır; bir kez eklenir (ilk maç varsa hiçbir şey yapılmaz).
 */

interface HistoryMatch {
  id: string;
  daysAgo: number;
  time: string;
  venue: string;
  sport: "futbol" | "basketbol" | "voleybol";
  format: string;
  capacity: number;
  title: string;
  organizer: string;
  players: string[];
  absent?: string[];
  late?: string[];
  mvp: string;
}

const HISTORY: HistoryMatch[] = [
  {
    id: "gecmis-sezon-acilisi",
    daysAgo: 54,
    time: "21:00",
    venue: "kmaras-merkez",
    sport: "futbol",
    format: "7v7",
    capacity: 14,
    title: "Sezon Açılışı Halı Saha",
    organizer: "ahmet",
    players: ["ahmet", "atahan", "can", "burak", "mert", "oguz", "emre", "yusuf", "kerem", "baris", "serkan", "onur", "hakan", "furkan"],
    absent: ["onur"],
    late: ["yusuf"],
    mvp: "oguz",
  },
  {
    id: "gecmis-sali-basket",
    daysAgo: 47,
    time: "20:00",
    venue: "elbistan-salon",
    sport: "basketbol",
    format: "3v3",
    capacity: 6,
    title: "Salı Akşamı Basket",
    organizer: "emre",
    players: ["emre", "atahan", "can", "furkan", "kerem", "serkan"],
    mvp: "atahan",
  },
  {
    id: "gecmis-cuma-hali-saha",
    daysAgo: 40,
    time: "21:00",
    venue: "elbistan-sentetik",
    sport: "futbol",
    format: "7v7",
    capacity: 14,
    title: "Cuma Halı Saha",
    organizer: "ahmet",
    players: ["ahmet", "atahan", "oguz", "mert", "burak", "can", "enes", "yusuf", "hakan", "baris", "onur", "serkan", "kerem", "emre"],
    absent: ["enes"],
    late: ["burak"],
    mvp: "can",
  },
  {
    id: "gecmis-hafta-sonu-voleybol",
    daysAgo: 33,
    time: "15:00",
    venue: "kmaras-kapali",
    sport: "voleybol",
    format: "6v6",
    capacity: 12,
    title: "Hafta Sonu Voleybol",
    organizer: "serkan",
    players: ["serkan", "atahan", "kerem", "baris", "furkan", "hakan", "enes", "yusuf", "mert", "can", "emre", "onur"],
    absent: ["onur"],
    mvp: "serkan",
  },
  {
    id: "gecmis-pazar-antrenman",
    daysAgo: 26,
    time: "10:00",
    venue: "elbistan-sentetik",
    sport: "futbol",
    format: "5v5",
    capacity: 10,
    title: "Pazar Sabahı Antrenman",
    organizer: "oguz",
    players: ["oguz", "atahan", "mert", "burak", "can", "ahmet", "emre", "furkan", "kerem", "yusuf"],
    late: ["burak"],
    mvp: "atahan",
  },
  {
    id: "gecmis-ilce-derbisi",
    daysAgo: 19,
    time: "21:00",
    venue: "kmaras-merkez",
    sport: "futbol",
    format: "7v7",
    capacity: 14,
    title: "İlçe Derbisi",
    organizer: "mert",
    players: ["mert", "ahmet", "oguz", "can", "burak", "emre", "yusuf", "kerem", "baris", "serkan", "hakan", "furkan", "enes", "onur"],
    mvp: "mert",
  },
  {
    id: "gecmis-basket-rovans",
    daysAgo: 12,
    time: "20:30",
    venue: "elbistan-salon",
    sport: "basketbol",
    format: "3v3",
    capacity: 6,
    title: "Basket Rövanş",
    organizer: "can",
    players: ["can", "atahan", "emre", "furkan", "kerem", "serkan"],
    mvp: "emre",
  },
  {
    id: "gecmis-persembe-hali-saha",
    daysAgo: 9,
    time: "21:30",
    venue: "elbistan-sentetik",
    sport: "futbol",
    format: "5v5",
    capacity: 10,
    title: "Perşembe Halı Saha",
    organizer: "burak",
    players: ["burak", "atahan", "oguz", "ahmet", "mert", "can", "onur", "enes", "hakan", "baris"],
    absent: ["onur"],
    mvp: "oguz",
  },
];

/** Oyuncuların takım arkadaşlarından en sık aldığı övgü (karakterleri) */
const SPECIALTY: Record<string, string | null> = {
  atahan: "taktiksel",
  ahmet: "centilmen",
  can: "dinamik",
  burak: "kaya-gibi",
  mert: "kaya-gibi",
  oguz: "kaya-gibi",
  emre: "dinamik",
  yusuf: "centilmen",
  kerem: "dinamik",
  baris: "centilmen",
  serkan: "taktiksel",
  onur: null,
  hakan: "centilmen",
  furkan: "dinamik",
  enes: null,
};
const PRAISE_IDS = ["centilmen", "dinamik", "kaya-gibi", "taktiksel"];

/** Türkiye saatiyle `days` gün önce, verilen saatte */
function daysAgo(days: number, time: string): string {
  const d = new Date(Date.now() + 3 * 3600_000);
  d.setUTCDate(d.getUTCDate() - days);
  return `${d.toISOString().slice(0, 10)}T${time}:00+03:00`;
}

/** Çok satırlı INSERT: her satır için ($1, $2, …) yer tutucuları üretir (tek sorguda, hızlı) */
async function insertRows(db: Db, sql: string, rows: unknown[][]) {
  if (rows.length === 0) return;
  const width = rows[0].length;
  const values = rows.map((_, r) => `(${Array.from({ length: width }, (_, c) => `$${r * width + c + 1}`).join(", ")})`).join(", ");
  await db.query(`${sql} VALUES ${values} ON CONFLICT DO NOTHING`, rows.flat());
}

export async function seedHistory(db: Db) {
  const [exists] = await db.query("SELECT 1 FROM matches WHERE id = $1", [HISTORY[0].id]);
  if (exists) return;

  for (const m of HISTORY) {
    const startsAt = daysAgo(m.daysAgo, m.time);
    await db.query(
      `INSERT INTO matches (id, venue_id, title, sport, format, starts_at, price, capacity, min_level, organizer_id, note, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 100, $7, 1, $8, 'Oynanmış maç.', $9) ON CONFLICT (id) DO NOTHING`,
      [m.id, m.venue, m.title, m.sport, m.format, startsAt, m.capacity, m.organizer, daysAgo(m.daysAgo + 4, "12:00")],
    );
    await insertRows(
      db,
      "INSERT INTO match_participants (match_id, player_id, joined_at)",
      m.players.map((p) => [m.id, p, daysAgo(m.daysAgo + 3, "12:00")]),
    );

    // Her oyuncuyu kadrodaki sıradaki 4 kişi değerlendirir (Atahan hariç: demo hesabı kendisi değerlendirsin)
    const reviewers = m.players.filter((p) => p !== "atahan");
    const reviews: unknown[][] = [];
    for (const target of m.players) {
      const others = reviewers.filter((r) => r !== target);
      const start = m.players.indexOf(target) % others.length;
      const chosen = [0, 1, 2, 3].map((k) => others[(start + k) % others.length]);
      const attended = !m.absent?.includes(target);
      const late = attended && !!m.late?.includes(target);
      const spec = SPECIALTY[target];
      chosen.forEach((reviewer, k) => {
        const second = spec ? PRAISE_IDS[(PRAISE_IDS.indexOf(spec) + 1) % PRAISE_IDS.length] : null;
        const praise = attended ? [spec, second, spec, null][k] : null;
        reviews.push([m.id, reviewer, target, attended, praise, late, startsAt]);
      });
    }
    await insertRows(db, "INSERT INTO match_reviews (match_id, reviewer_id, target_id, attended, praise_id, late, created_at)", reviews);

    // MVP: gelen ve Atahan olmayan 3 oyuncu aynı kişiye, 1 oyuncu başka birine oy verir
    const voters = reviewers.filter((p) => p !== m.mvp && !m.absent?.includes(p));
    const other = m.players.find((p) => p !== m.mvp && p !== voters[3] && !m.absent?.includes(p))!;
    await insertRows(db, "INSERT INTO match_mvp_votes (match_id, voter_id, target_id, created_at)", [
      [m.id, voters[0], m.mvp, startsAt],
      [m.id, voters[1], m.mvp, startsAt],
      [m.id, voters[2], m.mvp, startsAt],
      [m.id, voters[3], other, startsAt],
    ]);
  }
}
