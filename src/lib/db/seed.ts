import type { Db } from "./index";

/**
 * Boş veritabanına örnek veri ekler (yalnızca ilk açılışta).
 * Maç tarihleri seed anına göre hesaplanır: "yarın 21:00", "3 gün sonra 16:00" gibi.
 */

const PLAYERS = [
  // id, ad, baş harfler, renk, seviye, puan, genel güç
  ["atahan", "Atahan", "AT", "bg-primary", 14, 4.8, 88],
  ["ahmet", "Ahmet Erdem", "AE", "bg-warning", 14, 4.8, 82],
  ["can", "Can", "CY", "bg-info", 11, 4.6, 91],
  ["burak", "Burak", "BK", "bg-info", 9, 4.4, 79],
  ["mert", "Mert", "ML", "bg-info", 12, 4.7, 84],
  ["oguz", "Oğuz", "OS", "bg-warning", 16, 4.9, 94],
  ["emre", "Emre", "EK", "bg-violet", 13, 4.5, 86],
  ["yusuf", "Yusuf", "YA", "bg-info", 8, 4.3, 74],
  ["kerem", "Kerem", "KD", "bg-primary", 10, 4.5, 77],
  ["baris", "Barış", "BŞ", "bg-violet", 7, 4.2, 72],
  ["serkan", "Serkan", "SÖ", "bg-warning", 12, 4.6, 80],
  ["onur", "Onur", "OT", "bg-info", 6, 4.1, 70],
  ["hakan", "Hakan", "HY", "bg-primary", 9, 4.4, 76],
  ["furkan", "Furkan", "FA", "bg-violet", 11, 4.5, 81],
  ["enes", "Enes", "EB", "bg-warning", 5, 4.0, 68],
] as const;

/** Türkiye saatiyle (UTC+3), bugünden `days` gün sonra verilen saat */
function inDays(days: number, time: string): string {
  const now = new Date(Date.now() + 3 * 3600_000); // Türkiye'deki "bugün"
  now.setUTCDate(now.getUTCDate() + days);
  return `${now.toISOString().slice(0, 10)}T${time}:00+03:00`;
}

interface SeedMatch {
  id: string;
  venue: string;
  title: string;
  sport: string;
  format: string;
  startsAt: string;
  price: number;
  capacity: number;
  minLevel: number;
  organizer: string;
  note: string;
  /** [oyuncu, mevki, x, y] — mevki verilmeyenler dizilimde görünmez */
  participants: [string, string?, number?, number?][];
}

const MATCHES: SeedMatch[] = [
  {
    id: "cuma-aksami-hali-saha",
    venue: "elbistan-sentetik",
    title: "Cuma Akşamı Halı Saha",
    sport: "futbol",
    format: "7v7",
    startsAt: inDays(1, "21:00"),
    price: 120,
    capacity: 14,
    minLevel: 10,
    organizer: "ahmet",
    note: "Sadece defans veya kaleci oynayacak arkadaşlar gelsin, orta sahamız dolu. Ücret saha içinde ödenecek.",
    participants: [
      ["emre", "Snt", 50, 15],
      ["ahmet", "SolO", 22, 33],
      ["can", "SağO", 78, 33],
      ["burak", "Stp", 28, 67],
      ["mert", "Stp", 72, 67],
      ["oguz", "Klc", 50, 88],
      ["yusuf"],
      ["kerem"],
      ["baris"],
      ["serkan"],
      ["onur"],
      ["hakan"],
    ],
  },
  {
    id: "turnuva-antrenmani",
    venue: "kmaras-merkez",
    title: "Turnuva Antrenmanı",
    sport: "futbol",
    format: "5v5",
    startsAt: inDays(2, "10:00"),
    price: 90,
    capacity: 10,
    minLevel: 5,
    organizer: "oguz",
    note: "Turnuva öncesi son antrenman. Tempolu oynayacağız.",
    participants: [["oguz"], ["serkan"], ["furkan"], ["enes"], ["kerem"], ["hakan"], ["onur"], ["yusuf"]],
  },
  {
    id: "elbistan-basket",
    venue: "elbistan-salon",
    title: "Elbistan Basket Turnuvası",
    sport: "basketbol",
    format: "3v3",
    startsAt: inDays(3, "16:00"),
    price: 50,
    capacity: 6,
    minLevel: 3,
    organizer: "ahmet",
    note: "Yarı saha 3v3, 11 sayıya kadar.",
    participants: [["ahmet"], ["furkan"], ["baris"], ["enes"]],
  },
  {
    id: "plaj-voleybolu",
    venue: "kmaras-kapali",
    title: "Akşam Voleybolu",
    sport: "voleybol",
    format: "6v6",
    startsAt: inDays(6, "19:30"),
    price: 40,
    capacity: 12,
    minLevel: 1,
    organizer: "can",
    note: "Her seviyeden oyuncuya açık.",
    participants: [["can"], ["mert"], ["emre"], ["yusuf"], ["kerem"], ["baris"], ["serkan"], ["onur"], ["hakan"]],
  },
];

export async function seed(db: Db) {
  const [{ count }] = await db.query<{ count: number }>("SELECT count(*)::int AS count FROM players");
  if (count === 0) await seedInitial(db);
  await seedPastMatch(db);
}

async function seedInitial(db: Db) {
  for (const p of PLAYERS) {
    await db.query(
      `INSERT INTO players (id, name, initials, color, level, rating, overall)
       VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
      [...p],
    );
  }

  for (const m of MATCHES) {
    await db.query(
      `INSERT INTO matches (id, venue_id, title, sport, format, starts_at, price, capacity, min_level, organizer_id, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT (id) DO NOTHING`,
      [m.id, m.venue, m.title, m.sport, m.format, m.startsAt, m.price, m.capacity, m.minLevel, m.organizer, m.note],
    );
    for (const [i, [player, position, x, y]] of m.participants.entries()) {
      await db.query(
        `INSERT INTO match_participants (match_id, player_id, position, x, y, joined_at)
         VALUES ($1, $2, $3, $4, $5, now() - make_interval(mins => $6)) ON CONFLICT DO NOTHING`,
        [m.id, player, position ?? null, x ?? null, y ?? null, (m.participants.length - i) * 30],
      );
    }
  }
}

/**
 * Oynanmış bir örnek maç ve değerlendirmeleri (ikinci sürümde eklendi).
 * Var olan veritabanlarına da eklensin diye her açılışta denenir; maç zaten varsa hiçbir şey yapmaz.
 * Böylece demo hesabı "Takımı Değerlendir" akışını gerçek bir geçmiş maçla deneyebilir.
 */
async function seedPastMatch(db: Db) {
  const id = "gecen-hafta-hali-saha";
  const inserted = await db.query(
    `INSERT INTO matches (id, venue_id, title, sport, format, starts_at, price, capacity, min_level, organizer_id, note)
     VALUES ($1, 'elbistan-sentetik', 'Geçen Haftanın Maçı', 'futbol', '7v7', $2, 120, 14, 5, 'ahmet', 'Maç oynandı. Takım arkadaşlarını değerlendirmeyi unutma!')
     ON CONFLICT (id) DO NOTHING RETURNING id`,
    [id, inDays(-2, "21:00")],
  );
  if (inserted.length === 0) return;

  const lineup: [string, string?, number?, number?][] = [
    ["atahan", "Snt", 50, 15],
    ["ahmet", "SolO", 22, 33],
    ["can", "SağO", 78, 33],
    ["emre", "OS", 50, 50],
    ["burak", "Stp", 28, 67],
    ["mert", "Stp", 72, 67],
    ["oguz", "Klc", 50, 88],
    ["yusuf"], ["kerem"], ["baris"], ["serkan"], ["onur"], ["hakan"], ["furkan"],
  ];
  for (const [player, position, x, y] of lineup) {
    await db.query(
      `INSERT INTO match_participants (match_id, player_id, position, x, y, joined_at)
       VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`,
      [id, player, position ?? null, x ?? null, y ?? null, inDays(-5, "12:00")],
    );
  }

  // Başkalarının bıraktığı örnek oylar: Atahan'a övgüler; Onur'a 3 "Gelmedi" oyu (çoğunluk kuralını göstermek için)
  const reviews: [string, string, boolean, string | null][] = [
    ["ahmet", "atahan", true, "taktiksel"],
    ["can", "atahan", true, "dinamik"],
    ["burak", "atahan", true, "taktiksel"],
    ["ahmet", "onur", false, null],
    ["can", "onur", false, null],
    ["oguz", "onur", false, null],
    ["ahmet", "oguz", true, "kaya-gibi"],
  ];
  for (const [reviewer, target, attended, praise] of reviews) {
    await db.query(
      `INSERT INTO match_reviews (match_id, reviewer_id, target_id, attended, praise_id) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
      [id, reviewer, target, attended, praise],
    );
  }
}
