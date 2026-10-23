import { describe, expect, it } from "vitest";
import { evaluateBadges, type PlayerStats } from "@/lib/badges";
import { nextGoal, rankBy, type LeaderboardEntry } from "@/lib/leaderboard";
import { capacityFor, isSport } from "@/lib/sports";
import { hashPassword, validateRegistration, verifyPassword } from "@/lib/auth";
import { dayLabel, validateCreateMatch } from "@/lib/matches";

const emptyStats: PlayerStats = {
  matchesPlayed: 0,
  onTimeStreak: 0,
  sosAnswered: 0,
  ratingsGiven: 0,
  matchesOrganized: 0,
  venuesVisited: 0,
  sportsPlayed: 0,
  mvpAwards: 0,
};

describe("Başarımlar", () => {
  it("yeni oyuncunun hiç başarımı yoktur", () => {
    expect(evaluateBadges(emptyStats).every((b) => !b.earned)).toBe(true);
  });

  it("ilk maçla 'İlk Düdük' kazanılır", () => {
    const badges = evaluateBadges({ ...emptyStats, matchesPlayed: 1 });
    expect(badges.find((b) => b.id === "ilk-duduk")?.earned).toBe(true);
  });

  it("ilerleme hedefi aşmaz (çubuk %100'ü geçmez)", () => {
    const badges = evaluateBadges({ ...emptyStats, matchesOrganized: 99 });
    const organizer = badges.find((b) => b.id === "organizator")!;
    expect(organizer.current).toBe(organizer.target);
  });
});

/** Sıralama kurallarını sınamak için sabit örnek liste (gerçek veri src/lib/leaderboard-data.ts'ten gelir) */
const leaderboard: LeaderboardEntry[] = [
  ["ahmet", 4.9, 61, 18], ["burak", 4.8, 48, 9], ["eray", 4.8, 55, 14], ["mert", 4.7, 39, 7], ["caner", 4.6, 44, 6],
  ["volkan", 4.6, 30, 5], ["oguz", 4.5, 52, 11], ["can", 4.5, 27, 4], ["selin", 4.4, 33, 8], ["kaan", 4.4, 29, 3],
  ["deniz", 4.3, 24, 2], ["atahan", 4.2, 42, 12], ["yusuf", 4.1, 20, 1], ["emre", 4.0, 18, 2],
].map(([id, rating, matches, mvp]) => ({ id: id as string, name: id as string, initials: "", color: "", rating: rating as number, matches: matches as number, mvp: mvp as number }));

describe("Liderlik tablosu", () => {
  it("sıralama 1'den başlar ve kesintisizdir", () => {
    const ranked = rankBy(leaderboard, "rating");
    expect(ranked.map((e) => e.rank)).toEqual(ranked.map((_, i) => i + 1));
  });

  it("eşit puanda daha çok maç oynayan öne geçer", () => {
    const ranked = rankBy(leaderboard, "rating");
    const selin = ranked.find((e) => e.id === "selin")!; // 4.4, 33 maç
    const kaan = ranked.find((e) => e.id === "kaan")!; // 4.4, 29 maç
    expect(selin.rank).toBeLessThan(kaan.rank);
  });

  it("ilk 10 dışındaki oyuncuya ilk 10'a kalan fark gösterilir", () => {
    const ranked = rankBy(leaderboard, "rating");
    expect(nextGoal(ranked, "atahan")?.target).toBe("İlk 10'a");
  });

  it("zirvedeki oyuncunun hedefi yoktur", () => {
    const ranked = rankBy(leaderboard, "rating");
    expect(nextGoal(ranked, ranked[0].id)).toBeNull();
  });
});

describe("Branşlar", () => {
  it("formattan kontenjan hesaplanır", () => {
    expect(capacityFor("futbol", "7v7")).toBe(14);
    expect(capacityFor("tenis", "Çiftler")).toBe(4);
    expect(capacityFor("basketbol", "7v7")).toBeUndefined();
  });

  it("bilinmeyen branş reddedilir", () => {
    expect(isSport("futbol")).toBe(true);
    expect(isSport("kriket")).toBe(false);
  });
});

describe("Maç oluşturma doğrulaması (API 400)", () => {
  const valid = {
    title: "Pazar Tenisi",
    sport: "tenis",
    format: "Tekler",
    venueId: "elbistan-tenis",
    startsAt: new Date(Date.now() + 86_400_000).toISOString(),
    price: 0,
    minLevel: 1,
  };

  it("geçerli form kabul edilir", () => {
    expect(validateCreateMatch(valid).ok).toBe(true);
  });

  it("geçmiş tarihe maç açılamaz", () => {
    const result = validateCreateMatch({ ...valid, startsAt: "2020-01-01T10:00:00Z" });
    expect(result.ok).toBe(false);
  });

  it("branşa uymayan saha reddedilir (tenis maçı futbol sahasında olmaz)", () => {
    const result = validateCreateMatch({ ...valid, venueId: "elbistan-sentetik" });
    expect(result).toEqual({ ok: false, errors: ["Bu sahada seçilen branş oynanamıyor."] });
  });

  it("boş gövdede tüm hatalar birlikte döner", () => {
    const result = validateCreateMatch({});
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.length).toBeGreaterThanOrEqual(5);
  });
});

describe("Tarih etiketi (Türkiye saati)", () => {
  const now = new Date("2026-10-21T10:00:00+03:00");
  it("bugün, yarın ve haftanın günü doğru yazılır", () => {
    expect(dayLabel(new Date("2026-10-21T21:00:00+03:00"), now)).toBe("Bugün");
    expect(dayLabel(new Date("2026-10-22T21:00:00+03:00"), now)).toBe("Yarın");
    expect(dayLabel(new Date("2026-10-24T21:00:00+03:00"), now)).toBe("Cumartesi");
  });

  it("gece yarısından sonra (UTC'de hâlâ dün iken) doğru güne sayılır", () => {
    // 22 Ekim 01:30 Türkiye = 21 Ekim 22:30 UTC
    expect(dayLabel(new Date("2026-10-22T01:30:00+03:00"), now)).toBe("Yarın");
  });
});

describe("Şifre güvenliği", () => {
  it("şifre düz metin saklanmaz ve doğru şifre doğrulanır", async () => {
    const hash = await hashPassword("guvenli123");
    expect(hash).not.toContain("guvenli123");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("guvenli123", hash)).toBe(true);
    expect(await verifyPassword("yanlis", hash)).toBe(false);
  });

  it("aynı şifre her seferinde farklı özet üretir (tuz)", async () => {
    expect(await hashPassword("guvenli123")).not.toBe(await hashPassword("guvenli123"));
  });

  it("kayıt formu e-postayı küçük harfe çevirir, kısa şifreyi reddeder", () => {
    expect(validateRegistration({ name: "Eray Çocuk", email: " Eray@Test.COM ", password: "12345678" })).toMatchObject({
      ok: true,
      email: "eray@test.com",
    });
    expect(validateRegistration({ name: "Eray", email: "eray@test.com", password: "123" }).ok).toBe(false);
  });
});
