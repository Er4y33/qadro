export type Sport = "futbol" | "basketbol" | "voleybol" | "tenis";

export const SPORT_LABELS: Record<Sport, string> = {
  futbol: "Futbol",
  basketbol: "Basketbol",
  voleybol: "Voleybol",
  tenis: "Tenis",
};

export interface Player {
  id: string;
  name: string;
  initials: string;
  /** Avatar arka plan rengi (Tailwind sınıfı) */
  color: string;
  level: number;
  /** Maç sonu değerlendirmelerinden gelen ortalama puan (5 üzerinden) */
  rating: number;
}

export interface LineupSlot {
  player: Player;
  /** Kısa mevki etiketi: "Snt", "SolO", "Klc" … */
  position: string;
  /** Oyuncu kartındaki genel güç puanı */
  overall: number;
  /** Saha üzerindeki konum, yüzde cinsinden */
  x: number;
  y: number;
}

export interface Venue {
  id: string;
  name: string;
  /** Kartlarda kullanılan kısa ad */
  shortName: string;
  address: string;
  lat: number;
  lng: number;
  /** Kullanıcının konumuna uzaklık. Şimdilik sabit, ileride tarayıcı konumundan hesaplanacak. */
  distanceKm: number;
  driveMinutes: number;
  amenities: string[];
  /** Tesiste oynanabilen branşlar (maç oluştururken saha listesini süzmek için) */
  sports: Sport[];
}

export interface Match {
  id: string;
  venueId: string;
  title: string;
  sport: Sport;
  format: string;
  venue: string;
  venueShort: string;
  /** ISO tarih-saat (veritabanındaki starts_at) */
  startsAt: string;
  /** "Bugün", "Yarın", "Pazar", "24 Eki" … (Türkiye saatine göre hesaplanır) */
  dayLabel: string;
  time: string;
  isPublic: boolean;
  /** Katılım organizatör onayına bağlı mı ("İstekleri Yönet") */
  requiresApproval: boolean;
  pricePerPerson: number;
  capacity: number;
  joined: number;
  /** Maç 24 saatten az kaldıysa ve eksik varsa "acil" */
  tag: "yeni" | "acil";
  minLevel: number;
  organizer: Player;
  participants: Player[];
  lineup: LineupSlot[];
  note: string;
}
