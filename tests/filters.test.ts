/**
 * Ana sayfa filtreleri ("Filtreler" ekranı): tarih Türkiye saatine göre, ücret, boş yer ve seviye.
 */
import { describe, expect, it } from "vitest";
import { activeFilterCount, DEFAULT_FILTERS, filterMatches } from "@/lib/filters";
import type { Match } from "@/lib/types";

// 2026-10-23 cuma, Türkiye saatiyle 20:00
const now = new Date("2026-10-23T17:00:00Z");

const match = (id: string, startsAt: string, extra: Partial<Match> = {}): Match =>
  ({ id, sport: "futbol", startsAt, pricePerPerson: 100, joined: 5, capacity: 10, minLevel: 1, ...extra }) as Match;

const matches = [
  match("bugun", "2026-10-23T18:30:00Z"), // cuma 21:30
  match("gece-yarisi", "2026-10-23T21:30:00Z"), // UTC'de hâlâ cuma ama Türkiye'de cumartesi 00:30
  match("pazar", "2026-10-25T07:00:00Z", { sport: "basketbol", pricePerPerson: 0 }),
  match("pazartesi", "2026-10-26T16:00:00Z", { joined: 10, minLevel: 8 }),
  match("uzak", "2026-11-10T16:00:00Z", { pricePerPerson: 250 }),
];
const ids = (f: Partial<typeof DEFAULT_FILTERS>, level = 3) => filterMatches(matches, { ...DEFAULT_FILTERS, ...f }, { now, viewerLevel: level }).map((m) => m.id);

describe("Maç filtreleri", () => {
  it("varsayılan filtre hepsini gösterir", () => {
    expect(ids({})).toHaveLength(5);
  });

  it("bugün / yarın Türkiye saatine göre ayrılır", () => {
    expect(ids({ date: "today" })).toEqual(["bugun"]);
    expect(ids({ date: "tomorrow" })).toEqual(["gece-yarisi"]);
  });

  it("hafta sonu cumartesi ve pazarı kapsar, 7 gün sınırı uzak maçı dışarıda bırakır", () => {
    expect(ids({ date: "weekend" })).toEqual(["gece-yarisi", "pazar"]);
    expect(ids({ date: "week" })).not.toContain("uzak");
  });

  it("ücret, boş yer, seviye ve branş filtreleri birlikte çalışır", () => {
    expect(ids({ maxPrice: 0 })).toEqual(["pazar"]);
    expect(ids({ openOnly: true })).not.toContain("pazartesi");
    expect(ids({ myLevel: true }, 3)).not.toContain("pazartesi");
    expect(ids({ sport: "basketbol" })).toEqual(["pazar"]);
  });

  it("Filtreler düğmesindeki rozet branş dışındaki açık filtreleri sayar", () => {
    expect(activeFilterCount(DEFAULT_FILTERS)).toBe(0);
    expect(activeFilterCount({ ...DEFAULT_FILTERS, sport: "tenis", date: "today", openOnly: true })).toBe(2);
  });
});
