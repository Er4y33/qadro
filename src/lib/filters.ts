import type { Match, Sport } from "./types";

/**
 * Ana sayfadaki maç filtreleri ("Filtreler" ekranı). Saf fonksiyon: tarayıcıda çalışır, testlerde sınanır.
 * Tarih karşılaştırmaları Türkiye saatine göre yapılır (sunucu UTC'de çalışsa bile "bugün" doğru olur).
 */

export type DateFilter = "all" | "today" | "tomorrow" | "weekend" | "week";

export interface MatchFilters {
  sport: Sport | "all";
  date: DateFilter;
  /** Kişi başı en fazla ücret (₺); null = sınır yok */
  maxPrice: number | null;
  /** Yalnızca boş yeri olan maçlar */
  openOnly: boolean;
  /** Yalnızca seviye şartını karşıladığım maçlar */
  myLevel: boolean;
}

export const DEFAULT_FILTERS: MatchFilters = { sport: "all", date: "all", maxPrice: null, openOnly: false, myLevel: false };

export const DATE_LABELS: Record<DateFilter, string> = {
  all: "Tüm tarihler",
  today: "Bugün",
  tomorrow: "Yarın",
  weekend: "Hafta sonu",
  week: "7 gün içinde",
};

const DAY = 86_400_000;
const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(d);
/** Türkiye saatine göre haftanın günü (0 = pazar) */
const weekday = (d: Date) => new Date(`${dayKey(d)}T00:00:00Z`).getUTCDay();

function matchesDate(startsAt: Date, filter: DateFilter, now: Date): boolean {
  const key = dayKey(startsAt);
  switch (filter) {
    case "all":
      return true;
    case "today":
      return key === dayKey(now);
    case "tomorrow":
      return key === dayKey(new Date(now.getTime() + DAY));
    case "week":
      return startsAt.getTime() - now.getTime() <= 7 * DAY;
    case "weekend": {
      // Bu haftanın (bugün pazarsa bugünün) cumartesi ve pazarı
      const today = weekday(now);
      const toSaturday = today === 0 ? -1 : 6 - today;
      const saturday = dayKey(new Date(now.getTime() + toSaturday * DAY));
      const sunday = dayKey(new Date(now.getTime() + (toSaturday + 1) * DAY));
      return key === saturday || key === sunday;
    }
  }
}

export function filterMatches(matches: Match[], f: MatchFilters, ctx: { now: Date; viewerLevel: number }): Match[] {
  return matches.filter(
    (m) =>
      (f.sport === "all" || m.sport === f.sport) &&
      matchesDate(new Date(m.startsAt), f.date, ctx.now) &&
      (f.maxPrice === null || m.pricePerPerson <= f.maxPrice) &&
      (!f.openOnly || m.joined < m.capacity) &&
      (!f.myLevel || m.minLevel <= ctx.viewerLevel),
  );
}

/** Branş dışında kaç filtre açık (Filtreler düğmesindeki rozet) */
export function activeFilterCount(f: MatchFilters): number {
  return [f.date !== "all", f.maxPrice !== null, f.openOnly, f.myLevel].filter(Boolean).length;
}
