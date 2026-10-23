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
  return resolveAttendanceCounts(votes.length, votes.filter((attended) => !attended).length);
}

/** Aynı kural, oy sayılarıyla (veritabanından gelen toplam ve "Gelmedi" sayısı) */
export function resolveAttendanceCounts(totalVotes: number, absentVotes: number): boolean | null {
  if (totalVotes < MIN_ATTENDANCE_VOTES) return null;
  return absentVotes <= totalVotes / 2;
}

/**
 * Zamanında gelme kararı: Maça geldiği kesinleşmiş (bkz. resolveAttendanceCounts) ve
 * "Geç kaldı" oyları yarıyı geçmemişse zamanında gelmiş sayılır. Eşitlik oyuncu lehinedir.
 * null: henüz karar yok (yeterli oy yok). false: gelmedi ya da geç kaldı.
 */
export function resolveOnTime(totalVotes: number, absentVotes: number, lateVotes: number): boolean | null {
  const attended = resolveAttendanceCounts(totalVotes, absentVotes);
  if (attended === null) return null;
  return attended && lateVotes <= totalVotes / 2;
}

/**
 * "Demir Adam" serisi: en yeni maçtan geriye doğru üst üste zamanında gelinen maç sayısı.
 * Kararı henüz verilmemiş (null) maçlar seriyi bozmaz, atlanır.
 */
export function onTimeStreak(newestFirst: (boolean | null)[]): number {
  let streak = 0;
  for (const onTime of newestFirst) {
    if (onTime === null) continue;
    if (!onTime) break;
    streak += 1;
  }
  return streak;
}

/* ───────────── Oyuncu özellikleri (radar grafiği) ───────────── */

export interface AttributeInput {
  /** Övgü türüne göre alınan övgü sayıları */
  praises: { label: string; count: number }[];
  /** Takım arkadaşlarından alınan "Geldi" oyu sayısı */
  attendedVotes: number;
  /** Katılımı onaylanan maçlar ve bunların kaçına zamanında gelindiği */
  confirmed: number;
  onTime: number;
  /** 0–5 güvenilirlik puanı */
  reliability: number;
}

/**
 * Radar grafiğindeki 0–100 arası değerler. Hepsi takım arkadaşlarının oylarından gelir; oyuncu kendini puanlayamaz.
 * - Övgü eksenleri: "Geldi" oylarının yüzde kaçında bu övgü verildi.
 * - Dakiklik: onaylanan maçların yüzde kaçına zamanında gelindi.
 * - Güvenilirlik: 0–5 puanın yüzdelik karşılığı.
 * Hiç oy alınmadıysa null (grafik yerine açıklama gösterilir).
 */
export function playerAttributes(input: AttributeInput): { label: string; value: number }[] | null {
  if (input.attendedVotes === 0) return null;
  const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);
  return [
    ...input.praises.map((p) => ({ label: p.label, value: pct(p.count, input.attendedVotes) })),
    { label: "Dakiklik", value: pct(input.onTime, input.confirmed) },
    { label: "Güvenilirlik", value: Math.round(input.reliability * 20) },
  ];
}

/* ───────────── Maçın Oyuncusu (MVP) ───────────── */

/**
 * MVP kararı: En çok oyu alan oyuncu, en az MVP_MIN_VOTES oy aldıysa ve oy sayısında tek başına öndeyse MVP olur.
 * Eşitlikte kimse MVP sayılmaz. Böylece iki arkadaşın birbirini seçmesi tek başına yetmez.
 */
export const MVP_MIN_VOTES = 2;

export function resolveMvp(votes: { targetId: string; count: number }[]): string | null {
  if (votes.length === 0) return null;
  const max = Math.max(...votes.map((v) => v.count));
  const leaders = votes.filter((v) => v.count === max);
  return max >= MVP_MIN_VOTES && leaders.length === 1 ? leaders[0].targetId : null;
}

/* ───────────── Haftalık seri (Hook modeli: alışkanlık) ───────────── */

const TZ = "Europe/Istanbul";
const DAY = 86_400_000;

/** Türkiye saatine göre, tarihin içinde bulunduğu haftanın pazartesisi (YYYY-MM-DD) */
export function weekKey(date: Date): string {
  const local = new Date(new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(date) + "T00:00:00Z");
  const offset = (local.getUTCDay() + 6) % 7; // pazartesi = 0
  return new Date(local.getTime() - offset * DAY).toISOString().slice(0, 10);
}

export interface Streak {
  /** Üst üste maç oynanan hafta sayısı */
  current: number;
  /** Şimdiye kadarki en uzun seri */
  best: number;
  playedThisWeek: boolean;
}

/**
 * Haftalık oynama serisi. "Gelmedi" kararı verilen maçlar sayılmaz.
 * Bu hafta henüz oynanmadıysa seri bozulmaz: sayım geçen haftadan başlar.
 * Tasarım kararı: Kayıp korkusu (loss aversion) üzerine kurulu "serin yanıyor!" uyarıları kullanılmaz;
 * seri yalnızca bilgilendirici geri bildirimdir.
 */
export function weeklyStreak(matchDates: Date[], now = new Date()): Streak {
  const weeks = new Set(matchDates.map(weekKey));
  const thisWeek = weekKey(now);
  const prev = (key: string) => new Date(Date.parse(key) - 7 * DAY).toISOString().slice(0, 10);

  let cursor = weeks.has(thisWeek) ? thisWeek : prev(thisWeek);
  let current = 0;
  while (weeks.has(cursor)) {
    current += 1;
    cursor = prev(cursor);
  }

  let best = 0;
  for (const key of weeks) {
    if (weeks.has(prev(key))) continue; // serinin başlangıcı değil
    let length = 0;
    let k = key;
    while (weeks.has(k)) {
      length += 1;
      k = new Date(Date.parse(k) + 7 * DAY).toISOString().slice(0, 10);
    }
    best = Math.max(best, length);
  }
  return { current, best: Math.max(best, current), playedThisWeek: weeks.has(thisWeek) };
}

/* ───────────── Sezonlar ───────────── */

export interface Season {
  id: string;
  name: string;
  start: Date;
  end: Date;
}

const SEASONS = [
  { months: [2, 3, 4], name: "İlkbahar" },
  { months: [5, 6, 7], name: "Yaz" },
  { months: [8, 9, 10], name: "Sonbahar" },
  { months: [11, 0, 1], name: "Kış" },
] as const;

/**
 * Üç aylık sezonlar (İlkbahar, Yaz, Sonbahar, Kış). Sezon XP'si her sezon sıfırdan başlar;
 * böylece yeni katılan oyuncu da sıralamada yukarı çıkma şansı bulur (Akış: ulaşılabilir hedef).
 */
export function seasonOf(date = new Date()): Season {
  const local = new Date(date.getTime() + 3 * 3_600_000); // Türkiye saati (UTC+3)
  const month = local.getUTCMonth();
  const def = SEASONS.find((s) => (s.months as readonly number[]).includes(month))!;
  const startYear = month < def.months[0] ? local.getUTCFullYear() - 1 : local.getUTCFullYear();
  const start = new Date(Date.UTC(startYear, def.months[0], 1) - 3 * 3_600_000);
  const end = new Date(Date.UTC(startYear, def.months[0] + 3, 1) - 3 * 3_600_000);
  const label = def.name === "Kış" ? `${startYear}–${String(startYear + 1).slice(2)}` : String(startYear);
  return { id: `${startYear}-${def.name}`, name: `${def.name} Sezonu ${label}`, start, end };
}

export function daysLeft(season: Season, now = new Date()): number {
  return Math.max(0, Math.ceil((season.end.getTime() - now.getTime()) / DAY));
}
