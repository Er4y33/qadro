/**
 * Qadro oyunlaştırma kuralları
 *
 * Tasarım ilkeleri (Oyunlaştırma dersi bağlantıları):
 * - XP ve seviye, Öz Belirleme Kuramı'ndaki "yetkinlik" ihtiyacına hizmet eder.
 * - Qadro Puanı harcanabilir bir para birimi DEĞİLDİR, itibar ölçüsüdür.
 *   Böylece aşırı gerekçelendirme (overjustification) etkisinden kaçınılır.
 * - Her XP kaynağı bir hedef davranışa bağlıdır (D6, 2. adım):
 *   maça gelmek, zamanında gelmek, değerlendirme yapmak, S.O.S çağrısına yanıt vermek.
 */

export const XP_REWARDS = {
  matchAttended: 50,
  onTime: 15,
  ratedOthers: 10,
  sosAnswered: 40,
  mvp: 25,
} as const;

export type XpEvent = keyof typeof XP_REWARDS;

/** Bir seviyeden sonrakine geçmek için gereken XP. Seviye yükseldikçe yavaşça artar. */
export function xpForNextLevel(level: number): number {
  return Math.round(100 * Math.pow(level, 1.35));
}

/** Toplam XP'den seviye ve mevcut seviyedeki ilerlemeyi hesaplar. */
export function levelFromXp(totalXp: number): { level: number; current: number; needed: number } {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= xpForNextLevel(level)) {
    remaining -= xpForNextLevel(level);
    level += 1;
  }
  return { level, current: remaining, needed: xpForNextLevel(level) };
}

/**
 * Güvenilirlik: katıldığını söylediği maçlara gerçekten gelme oranı.
 * Yeni kullanıcı tek bir maçla 0 ya da 5 olmasın diye 5 maçlık "nötr" bir başlangıç varsayılır.
 */
export function reliabilityScore(joined: number, attended: number): number {
  const PRIOR_MATCHES = 5;
  const PRIOR_RATE = 0.8;
  const rate = (attended + PRIOR_MATCHES * PRIOR_RATE) / (joined + PRIOR_MATCHES);
  return Math.round(rate * 50) / 10; // 0–5 arası, tek ondalık
}

/**
 * Maç sonu "Geldi / Gelmedi" oylarından bir oyuncunun maça gelip gelmediğine karar verir.
 *
 * Kötüye kullanıma karşı önlem: Tek bir kişinin "Gelmedi" demesi yetmez.
 * - En az MIN_ATTENDANCE_VOTES oy gerekir; daha azsa karar verilmez (null).
 * - "Gelmedi" sayılması için oyların yarıdan fazlası "Gelmedi" olmalıdır. Eşitlikte oyuncu lehine karar verilir.
 */
export const MIN_ATTENDANCE_VOTES = 3;

export function resolveAttendance(votes: boolean[]): boolean | null {
  if (votes.length < MIN_ATTENDANCE_VOTES) return null;
  const absentVotes = votes.filter((attended) => !attended).length;
  return absentVotes <= votes.length / 2;
}
