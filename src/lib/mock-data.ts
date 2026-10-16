/**
 * Örnek veri. Maçlar ve katılımlar artık veritabanında (src/lib/db); burada kalanlar:
 * saha kataloğu, profil ve sohbet örnekleri.
 * İsimler ve mekânlar Figma tasarımlarındaki örneklerle aynıdır.
 */
import type { PlayerStats } from "./badges";
import type { ChatMessage, ChatPreview, Player, Venue } from "./types";

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
  /** Profildeki "Son Maçlar" örneği (değerlendirme akışını açar) */
  recentMatch: { id: "cuma-aksami-hali-saha", title: "Cuma Akşamı Halı Saha", format: "7v7" },
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
    shortName: "Sentetik Saha",
    address: "Orhangazi Mah. Spor Cad. No: 12",
    lat: 38.2052,
    lng: 37.1975,
    distanceKm: 2.4,
    driveMinutes: 8,
    amenities: ["Ücretsiz Otopark", "Sıcak Duş", "Kiralık Ayakkabı"],
    sports: ["futbol"],
  },
  {
    id: "kmaras-merkez",
    name: "Kahramanmaraş Merkez Saha",
    shortName: "Merkez Saha",
    address: "Dulkadiroğlu, Kahramanmaraş",
    lat: 37.5858,
    lng: 36.9371,
    distanceKm: 6.1,
    driveMinutes: 14,
    amenities: ["Otopark", "Soyunma Odası"],
    sports: ["futbol"],
  },
  {
    id: "elbistan-salon",
    name: "Elbistan Spor Salonu",
    shortName: "Spor Salonu",
    address: "Elbistan, Kahramanmaraş",
    lat: 38.2008,
    lng: 37.1886,
    distanceKm: 3.2,
    driveMinutes: 10,
    amenities: ["Kapalı Alan", "Duş"],
    sports: ["basketbol", "voleybol"],
  },
  {
    id: "kmaras-kapali",
    name: "Merkez Kapalı Salon",
    shortName: "Kapalı Salon",
    address: "Onikişubat, Kahramanmaraş",
    lat: 37.5768,
    lng: 36.9147,
    distanceKm: 7.4,
    driveMinutes: 17,
    amenities: ["Kapalı Alan", "Tribün"],
    sports: ["basketbol", "voleybol"],
  },
  {
    id: "elbistan-tenis",
    name: "Elbistan Tenis Kortları",
    shortName: "Tenis Kortları",
    address: "Elbistan Gençlik Merkezi, Kahramanmaraş",
    lat: 38.2079,
    lng: 37.1921,
    distanceKm: 1.8,
    driveMinutes: 6,
    amenities: ["Aydınlatma", "Raket Kiralama"],
    sports: ["tenis"],
  },
];

export function getVenue(id: string): Venue | undefined {
  return venues.find((v) => v.id === id);
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
