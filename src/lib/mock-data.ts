/**
 * Geçici örnek veri. Veritabanı (Supabase) bağlanınca bu dosyanın yerini API çağrıları alacak.
 * İsimler ve mekânlar Figma tasarımlarındaki örneklerle aynıdır.
 */
import type { PlayerStats } from "./badges";
import type { ChatMessage, ChatPreview, Match, Player, Venue } from "./types";

export const players: Record<string, Player> = {
  atahan: { id: "atahan", name: "Atahan", initials: "AT", color: "bg-primary", level: 14, rating: 4.8 },
  ahmet: { id: "ahmet", name: "Ahmet Erdem", initials: "AE", color: "bg-warning", level: 14, rating: 4.8 },
  can: { id: "can", name: "Can", initials: "CY", color: "bg-info", level: 11, rating: 4.6 },
  burak: { id: "burak", name: "Burak", initials: "BK", color: "bg-info", level: 9, rating: 4.4 },
  mert: { id: "mert", name: "Mert", initials: "ML", color: "bg-info", level: 12, rating: 4.7 },
  oguz: { id: "oguz", name: "Oğuz", initials: "OS", color: "bg-warning", level: 16, rating: 4.9 },
};

export const currentUser = {
  ...players.atahan,
  role: "Oyun Kurucu",
  city: "Kahramanmaraş",
  matchesPlayed: 42,
  mvpAwards: 12,
  totalXp: 19700,
  /** Rozet koşulları için istatistikler */
  stats: {
    matchesPlayed: 42,
    onTimeStreak: 12,
    sosAnswered: 3,
    ratingsGiven: 31,
    matchesOrganized: 7,
    venuesVisited: 4,
    sportsPlayed: 2,
    mvpAwards: 12,
  } satisfies PlayerStats,
  /** Radar grafiği için 0–100 arası özellik puanları */
  attributes: [
    { label: "Kondisyon", value: 88 },
    { label: "Pas", value: 82 },
    { label: "Şut", value: 70 },
    { label: "Defans", value: 64 },
    { label: "Fizik", value: 72 },
    { label: "Taktik", value: 78 },
  ],
};

/** Örnek tesisler. Adresler ve koordinatlar temsilidir. */
export const venues: Venue[] = [
  {
    id: "elbistan-sentetik",
    name: "Elbistan Sentetik Saha",
    address: "Orhangazi Mah. Spor Cad. No: 12",
    lat: 38.2052,
    lng: 37.1975,
    distanceKm: 2.4,
    driveMinutes: 8,
    amenities: ["Ücretsiz Otopark", "Sıcak Duş", "Kiralık Ayakkabı"],
  },
  {
    id: "kmaras-merkez",
    name: "Kahramanmaraş Merkez Saha",
    address: "Dulkadiroğlu, Kahramanmaraş",
    lat: 37.5858,
    lng: 36.9371,
    distanceKm: 6.1,
    driveMinutes: 14,
    amenities: ["Otopark", "Soyunma Odası"],
  },
  {
    id: "elbistan-salon",
    name: "Elbistan Spor Salonu",
    address: "Elbistan, Kahramanmaraş",
    lat: 38.2008,
    lng: 37.1886,
    distanceKm: 3.2,
    driveMinutes: 10,
    amenities: ["Kapalı Alan", "Duş"],
  },
  {
    id: "kmaras-kapali",
    name: "Merkez Kapalı Salon",
    address: "Onikişubat, Kahramanmaraş",
    lat: 37.5768,
    lng: 36.9147,
    distanceKm: 7.4,
    driveMinutes: 17,
    amenities: ["Kapalı Alan", "Tribün"],
  },
];

export function getVenue(id: string): Venue | undefined {
  return venues.find((v) => v.id === id);
}

const filler = (n: number): Player[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `p${i}`,
    name: `Oyuncu ${i + 1}`,
    initials: "",
    color: ["bg-info", "bg-primary", "bg-violet", "bg-warning"][i % 4],
    level: 5 + i,
    rating: 4.2,
  }));

export const matches: Match[] = [
  {
    id: "cuma-aksami-hali-saha",
    venueId: "elbistan-sentetik",
    title: "Cuma Akşamı Halı Saha",
    sport: "futbol",
    format: "7v7",
    venue: "Elbistan Sentetik Saha",
    venueShort: "Sentetik Saha",
    dayLabel: "Yarın",
    time: "21:00",
    pricePerPerson: 120,
    capacity: 14,
    joined: 12,
    tag: "yeni",
    minLevel: 10,
    organizer: players.ahmet,
    participants: filler(12),
    note: "Sadece defans veya kaleci oynayacak arkadaşlar gelsin, orta sahamız dolu. Ücret saha içinde ödenecek.",
    lineup: [
      { player: players.atahan, position: "Snt", overall: 88, x: 50, y: 15 },
      { player: players.ahmet, position: "SolO", overall: 82, x: 22, y: 33 },
      { player: players.can, position: "SağO", overall: 91, x: 78, y: 33 },
      { player: players.burak, position: "Stp", overall: 79, x: 28, y: 67 },
      { player: players.mert, position: "Stp", overall: 84, x: 72, y: 67 },
      { player: players.oguz, position: "Klc", overall: 94, x: 50, y: 88 },
    ],
  },
  {
    id: "turnuva-antrenmani",
    venueId: "kmaras-merkez",
    title: "Turnuva Antrenmanı",
    sport: "futbol",
    format: "5v5",
    venue: "Kahramanmaraş Merkez Saha",
    venueShort: "Merkez Saha",
    dayLabel: "Cumartesi",
    time: "10:00",
    pricePerPerson: 90,
    capacity: 10,
    joined: 8,
    tag: "acil",
    minLevel: 5,
    organizer: players.oguz,
    participants: filler(8),
    note: "Turnuva öncesi son antrenman. Tempolu oynayacağız.",
    lineup: [],
  },
  {
    id: "elbistan-basket",
    venueId: "elbistan-salon",
    title: "Elbistan Basket Turnuvası",
    sport: "basketbol",
    format: "3v3",
    venue: "Elbistan Spor Salonu",
    venueShort: "Spor Salonu",
    dayLabel: "Pazar",
    time: "16:00",
    pricePerPerson: 50,
    capacity: 6,
    joined: 4,
    tag: "yeni",
    minLevel: 3,
    organizer: players.ahmet,
    participants: filler(4),
    note: "Yarı saha 3v3, 11 sayıya kadar.",
    lineup: [],
  },
  {
    id: "plaj-voleybolu",
    venueId: "kmaras-kapali",
    title: "Akşam Voleybolu",
    sport: "voleybol",
    format: "6v6",
    venue: "Merkez Kapalı Salon",
    venueShort: "Kapalı Salon",
    dayLabel: "Perşembe",
    time: "19:30",
    pricePerPerson: 40,
    capacity: 12,
    joined: 9,
    tag: "yeni",
    minLevel: 1,
    organizer: players.can,
    participants: filler(9),
    note: "Her seviyeden oyuncuya açık.",
    lineup: [],
  },
];

export function getMatch(id: string): Match | undefined {
  return matches.find((m) => m.id === id);
}

export const chats: ChatPreview[] = [
  {
    id: "cuma-aksami-hali-saha",
    title: "Cuma Akşamı Halı Saha",
    format: "7v7",
    lastSender: "Burak",
    lastMessage: "Bende yedek eldiven var...",
    time: "19:10",
    unread: 2,
    tone: "success",
  },
  {
    id: "pazar-sabahi",
    title: "Pazar Sabahı Antrenman",
    format: "5v5",
    lastSender: "Sen",
    lastMessage: "Saha parası nakit miydi?",
    time: "Dün",
    unread: 0,
    tone: "primary",
  },
  {
    id: "elbistan-basket",
    title: "Elbistan Basket Turnuvası",
    format: "3v3",
    lastSender: "Ahmet",
    lastMessage: "Beyler elinize sağlık...",
    time: "Salı",
    unread: 0,
    tone: "violet",
  },
];

export const chatMessages: ChatMessage[] = [
  { id: "1", sender: players.ahmet, text: "Beyler IBAN'ı bırakıyorum, kişi başı ₺120.", time: "18:45" },
  {
    id: "2",
    sender: players.ahmet,
    iban: { number: "TR12 3456 7890 0000 1234 56", holder: "Ahmet Erdem" },
    time: "18:45",
  },
  { id: "3", sender: "me", text: "Ben parayı gönderdim dostum. Eldiven getiren var mı, kaleye geçmek lazım.", time: "18:52" },
  { id: "4", sender: players.burak, text: "Bende yedek eldiven var, getiririm.", time: "19:10" },
];
