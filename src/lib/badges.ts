/**
 * Qadro rozet sistemi
 *
 * Tasarım ilkeleri (ayrıntı: docs/oyunlastirma-rotasi.md):
 * - Her rozet bir HEDEF DAVRANIŞA bağlıdır (D6, 2. adım). "Giriş yaptın" gibi
 *   anlamsız rozet yoktur; bu, PBL (puan-rozet-liderlik) eleştirisine verilen cevaptır.
 * - Rozetler XP veya para vermez. Yalnızca bilgilendirici geri bildirimdir.
 *   Öz Belirleme Kuramı'na göre kontrol edici değil, bilgilendirici ödül
 *   içsel motivasyonu zayıflatmaz (aşırı gerekçelendirme riskini azaltır).
 * - Rozetler farklı Hexad oyuncu tiplerine hitap edecek şekilde dağıtılmıştır.
 */

export type HexadType = "Achiever" | "Socialiser" | "Philanthropist" | "Free Spirit" | "Player";

/** Rozet koşullarının hesaplandığı oyuncu istatistikleri */
export interface PlayerStats {
  matchesPlayed: number;
  /** Üst üste zamanında gelinen maç sayısı */
  onTimeStreak: number;
  sosAnswered: number;
  ratingsGiven: number;
  matchesOrganized: number;
  venuesVisited: number;
  sportsPlayed: number;
  mvpAwards: number;
}

export type BadgeIcon =
  | "Flag"
  | "ShieldCheck"
  | "LifeBuoy"
  | "Handshake"
  | "ClipboardList"
  | "Compass"
  | "Shapes"
  | "Trophy";

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: BadgeIcon;
  hexad: HexadType;
  /** Rozetin bağlı olduğu istatistik ve hedef değer */
  stat: keyof PlayerStats;
  target: number;
}

export const BADGES: BadgeDefinition[] = [
  {
    id: "ilk-duduk",
    name: "İlk Düdük",
    description: "İlk maçını oyna.",
    icon: "Flag",
    hexad: "Achiever",
    stat: "matchesPlayed",
    target: 1,
  },
  {
    id: "demir-adam",
    name: "Demir Adam",
    description: "Üst üste 10 maça zamanında gel.",
    icon: "ShieldCheck",
    hexad: "Achiever",
    stat: "onTimeStreak",
    target: 10,
  },
  {
    id: "kurtarici",
    name: "Kurtarıcı",
    description: "5 S.O.S çağrısına yanıt verip eksik kadroyu tamamla.",
    icon: "LifeBuoy",
    hexad: "Philanthropist",
    stat: "sosAnswered",
    target: 5,
  },
  {
    id: "adil-oyuncu",
    name: "Adil Oyuncu",
    description: "20 maç sonunda takım arkadaşlarını değerlendir.",
    icon: "Handshake",
    hexad: "Socialiser",
    stat: "ratingsGiven",
    target: 20,
  },
  {
    id: "organizator",
    name: "Organizatör",
    description: "5 maç organize et.",
    icon: "ClipboardList",
    hexad: "Socialiser",
    stat: "matchesOrganized",
    target: 5,
  },
  {
    id: "saha-kasifi",
    name: "Saha Kaşifi",
    description: "5 farklı tesiste oyna.",
    icon: "Compass",
    hexad: "Free Spirit",
    stat: "venuesVisited",
    target: 5,
  },
  {
    id: "cok-yonlu",
    name: "Çok Yönlü",
    description: "3 farklı branşta maç oyna.",
    icon: "Shapes",
    hexad: "Free Spirit",
    stat: "sportsPlayed",
    target: 3,
  },
  {
    id: "macin-yildizi",
    name: "Maçın Yıldızı",
    description: "10 kez maçın oyuncusu (MVP) seçil.",
    icon: "Trophy",
    hexad: "Player",
    stat: "mvpAwards",
    target: 10,
  },
];

export interface BadgeProgress extends BadgeDefinition {
  current: number;
  earned: boolean;
}

/** Oyuncunun istatistiklerine göre her rozetin durumunu hesaplar. */
export function evaluateBadges(stats: PlayerStats): BadgeProgress[] {
  return BADGES.map((badge) => {
    const value = stats[badge.stat];
    return {
      ...badge,
      current: Math.min(value, badge.target),
      earned: value >= badge.target,
    };
  });
}
