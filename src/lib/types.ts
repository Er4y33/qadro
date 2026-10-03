export type Sport = "futbol" | "basketbol" | "voleybol";

export const SPORT_LABELS: Record<Sport, string> = {
  futbol: "Futbol",
  basketbol: "Basketbol",
  voleybol: "Voleybol",
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

export interface Match {
  id: string;
  title: string;
  sport: Sport;
  format: string;
  venue: string;
  venueShort: string;
  dayLabel: string;
  time: string;
  pricePerPerson: number;
  capacity: number;
  joined: number;
  tag: "yeni" | "acil";
  minLevel: number;
  organizer: Player;
  participants: Player[];
  lineup: LineupSlot[];
  note: string;
}

export interface ChatPreview {
  id: string;
  title: string;
  format: string;
  lastSender: string;
  lastMessage: string;
  time: string;
  unread: number;
  tone: "success" | "primary" | "violet";
}

export interface ChatMessage {
  id: string;
  sender: Player | "me";
  text?: string;
  iban?: { number: string; holder: string };
  time: string;
}
