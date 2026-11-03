import { describe, expect, it } from "vitest";
import {
  daysLeft,
  levelFromXp,
  reliabilityScore,
  resolveAttendance,
  resolveAttendanceCounts,
  resolveMvp,
  seasonOf,
  weekKey,
  weeklyStreak,
  xpForNextLevel,
  onTimeStreak,
  playerAttributes,
  resolveOnTime,
  reliabilityTier,
} from "@/lib/gamification";
import { isTaken, tennisRole, zonesFor } from "@/lib/courts";
import { ALL_PRAISES, praisesFor } from "@/lib/praise";

describe("Seviye ve XP", () => {
  it("0 XP ile oyuncu 1. seviyededir", () => {
    expect(levelFromXp(0)).toEqual({ level: 1, current: 0, needed: xpForNextLevel(1) });
  });

  it("seviye eşiğine tam ulaşınca bir sonraki seviyeye geçer", () => {
    expect(levelFromXp(xpForNextLevel(1)).level).toBe(2);
    expect(levelFromXp(xpForNextLevel(1) - 1).level).toBe(1);
  });

  it("her seviye bir öncekinden daha fazla XP ister (artan zorluk)", () => {
    for (let level = 1; level < 30; level++) {
      expect(xpForNextLevel(level + 1)).toBeGreaterThan(xpForNextLevel(level));
    }
  });
});

describe("Güvenilirlik puanı", () => {
  it("yeni oyuncu nötr başlangıç puanıyla (4.0) başlar, 0 ya da 5 olmaz", () => {
    expect(reliabilityScore(0, 0)).toBe(4);
  });

  it("tek bir gelmeme puanı sıfırlamaz", () => {
    expect(reliabilityScore(1, 0)).toBeGreaterThan(3);
  });

  it("hep gelen oyuncunun puanı 5'e yaklaşır, hiç gelmeyeninki düşer", () => {
    expect(reliabilityScore(30, 30)).toBeGreaterThan(4.8);
    expect(reliabilityScore(30, 0)).toBeLessThan(1);
  });
});

describe('"Gelmedi" kararı (çoğunluk oyu)', () => {
  it("3'ten az oyla karar verilmez", () => {
    expect(resolveAttendance([false, false])).toBeNull();
  });

  it("tek kişinin kötü niyetli oyu oyuncuyu cezalandıramaz", () => {
    expect(resolveAttendance([false, true, true])).toBe(true);
  });

  it("çoğunluk 'Gelmedi' derse gelmedi sayılır", () => {
    expect(resolveAttendance([false, false, true])).toBe(false);
  });

  it("eşitlikte oyuncu lehine karar verilir", () => {
    expect(resolveAttendance([false, false, true, true])).toBe(true);
  });

  it("sayılarla çalışan sürüm aynı sonucu verir", () => {
    expect(resolveAttendanceCounts(4, 3)).toBe(false);
    expect(resolveAttendanceCounts(4, 2)).toBe(true);
    expect(resolveAttendanceCounts(2, 2)).toBeNull();
  });
});

describe("Maçın Oyuncusu (MVP)", () => {
  it("en az 2 oy alan ve tek başına önde olan MVP olur", () => {
    expect(resolveMvp([{ targetId: "oguz", count: 3 }, { targetId: "can", count: 1 }])).toBe("oguz");
  });

  it("tek oy yetmez (iki arkadaşın birbirini seçmesi engellenir)", () => {
    expect(resolveMvp([{ targetId: "oguz", count: 1 }])).toBeNull();
  });

  it("eşitlikte kimse MVP olmaz", () => {
    expect(resolveMvp([{ targetId: "oguz", count: 2 }, { targetId: "can", count: 2 }])).toBeNull();
  });

  it("hiç oy yoksa MVP yoktur", () => {
    expect(resolveMvp([])).toBeNull();
  });
});

describe("Haftalık seri", () => {
  // 2026-10-21 Çarşamba, Türkiye saatiyle öğlen
  const now = new Date("2026-10-21T12:00:00+03:00");
  const weeksAgo = (n: number) => new Date(now.getTime() - n * 7 * 86_400_000);

  it("haftanın anahtarı o haftanın pazartesisidir", () => {
    expect(weekKey(now)).toBe("2026-10-19");
    expect(weekKey(new Date("2026-10-25T23:30:00+03:00"))).toBe("2026-10-19"); // pazar gecesi aynı hafta
    expect(weekKey(new Date("2026-10-26T00:30:00+03:00"))).toBe("2026-10-26"); // pazartesi yeni hafta
  });

  it("üst üste oynanan haftaları sayar", () => {
    expect(weeklyStreak([now, weeksAgo(1), weeksAgo(2)], now)).toEqual({ current: 3, best: 3, playedThisWeek: true });
  });

  it("bu hafta henüz oynanmadıysa seri bozulmaz", () => {
    expect(weeklyStreak([weeksAgo(1), weeksAgo(2)], now).current).toBe(2);
  });

  it("bir hafta atlanınca seri sıfırlanır ama en iyi seri hatırlanır", () => {
    const streak = weeklyStreak([weeksAgo(3), weeksAgo(4), weeksAgo(5), weeksAgo(6)], now);
    expect(streak.current).toBe(0);
    expect(streak.best).toBe(4);
  });

  it("aynı haftadaki iki maç tek hafta sayılır", () => {
    expect(weeklyStreak([now, now], now).current).toBe(1);
  });
});

describe("Sezonlar", () => {
  it("ekim ayı Sonbahar sezonundadır ve sezon 1 Eylül'de başlar", () => {
    const season = seasonOf(new Date("2026-10-21T12:00:00+03:00"));
    expect(season.name).toBe("Sonbahar Sezonu 2026");
    expect(season.start.toISOString()).toBe("2026-08-31T21:00:00.000Z"); // 1 Eylül 00:00 Türkiye saati
  });

  it("ocak ayı bir önceki yıl başlayan Kış sezonuna aittir", () => {
    expect(seasonOf(new Date("2027-01-15T12:00:00+03:00")).name).toBe("Kış Sezonu 2026–27");
  });

  it("sezon bitişine kalan gün negatif olmaz", () => {
    const season = seasonOf(new Date("2026-10-21T12:00:00+03:00"));
    expect(daysLeft(season, new Date("2026-10-21T12:00:00+03:00"))).toBe(41);
    expect(daysLeft(season, new Date("2027-05-01T00:00:00+03:00"))).toBe(0);
  });
});

describe("Zamanında gelme ve Demir Adam serisi", () => {
  it("geldiği onaylanan ve çoğunluk 'geç kaldı' demeyen oyuncu zamanında sayılır", () => {
    expect(resolveOnTime(4, 0, 1)).toBe(true);
    expect(resolveOnTime(4, 0, 2)).toBe(true); // eşitlik oyuncu lehine
    expect(resolveOnTime(4, 0, 3)).toBe(false);
  });

  it("oy yetersizse karar yok, gelmediyse zamanında da sayılmaz", () => {
    expect(resolveOnTime(2, 0, 0)).toBeNull();
    expect(resolveOnTime(3, 3, 0)).toBe(false);
  });

  it("seri en yeni maçtan geriye sayılır, kararsız maçlar seriyi bozmaz", () => {
    expect(onTimeStreak([true, null, true, false, true])).toBe(2);
    expect(onTimeStreak([false, true, true])).toBe(0);
    expect(onTimeStreak([])).toBe(0);
  });
});

describe("Oyuncu özellikleri (radar)", () => {
  const praises = [
    { label: "Centilmen", count: 3 },
    { label: "Dinamik", count: 0 },
    { label: "Kaya Gibi", count: 1 },
    { label: "Taktiksel", count: 6 },
  ];

  it("hiç oy almayan oyuncunun grafiği yoktur", () => {
    expect(playerAttributes({ praises, attendedVotes: 0, confirmed: 0, onTime: 0, reliability: 4 })).toBeNull();
  });

  it("değerler 0–100 arası yüzdedir ve oylardan hesaplanır", () => {
    const attrs = playerAttributes({ praises, attendedVotes: 12, confirmed: 4, onTime: 3, reliability: 4.5 })!;
    expect(attrs.find((a) => a.label === "Taktiksel")?.value).toBe(50); // 6 / 12
    expect(attrs.find((a) => a.label === "Dakiklik")?.value).toBe(75); // 3 / 4
    expect(attrs.find((a) => a.label === "Güvenilirlik")?.value).toBe(90); // 4.5 / 5
    expect(attrs.every((a) => a.value >= 0 && a.value <= 100)).toBe(true);
  });
});

describe("Branşa özel saha, övgü ve kademe (Kasım 2026 tasarımı)", () => {
  it("her branşın kendi saha bölgeleri vardır; tenis teklerde iki, çiftlerde dört yer", () => {
    expect(zonesFor("basketbol", "5v5").map((z) => z.label)).toContain("Pivot");
    expect(zonesFor("voleybol", "6v6").map((z) => z.label)).toContain("Libero");
    expect(zonesFor("tenis", "Tekler")).toHaveLength(2);
    expect(zonesFor("tenis", "Çiftler")).toHaveLength(4);
    // Kısa kodlar veritabanına yazılır: en fazla 8 karakter (API sınırı)
    for (const sport of ["futbol", "basketbol", "voleybol", "tenis"] as const) {
      for (const z of zonesFor(sport, "Çiftler")) expect(z.short.length).toBeLessThanOrEqual(8);
    }
  });

  it("dolu bölge, sahadaki oyuncunun yerine yakın olandır", () => {
    expect(isTaken({ x: 35, y: 30 }, [{ x: 36, y: 31 }])).toBe(true);
    expect(isTaken({ x: 35, y: 30 }, [{ x: 66, y: 30 }])).toBe(false);
  });

  it("tenis kortunda aynı taraf Partner, karşı taraf Rakip", () => {
    expect(tennisRole(80, 20)).toBe("Rakip");
    expect(tennisRole(20, 20)).toBe("Partner");
    expect(tennisRole(80, undefined)).toBe("Rakip");
  });

  it("her branşın övgüleri farklıdır, Centilmen ortaktır ve kimlikler benzersizdir", () => {
    expect(praisesFor("basketbol").map((p) => p.label)).toEqual(["Centilmen", "Keskin Şutör", "Oyun Kurucu", "Ribaund Canavarı"]);
    expect(praisesFor("voleybol").some((p) => p.id === "kaya-gibi")).toBe(false);
    expect(new Set(ALL_PRAISES.map((p) => p.id)).size).toBe(ALL_PRAISES.length);
  });

  it("radar eksenleri övgünün eksen adını kullanır", () => {
    const attrs = playerAttributes({
      praises: praisesFor("basketbol").map((p) => ({ ...p, count: 2 })),
      attendedVotes: 4,
      confirmed: 1,
      onTime: 1,
      reliability: 5,
    })!;
    expect(attrs.map((a) => a.label)).toEqual(["Fair Play", "Şut", "Asist", "Ribaund", "Dakiklik", "Güvenilirlik"]);
  });

  it("güvenilirlik kademesi: 4.7 ve üstü Efsanevi", () => {
    expect(reliabilityTier(4.8).label).toBe("Efsanevi");
    expect(reliabilityTier(4.7).id).toBe("efsanevi");
    expect(reliabilityTier(4.2).id).toBe("guvenilir");
    expect(reliabilityTier(3.1).id).toBe("gelisiyor");
    expect(reliabilityTier(2.5).id).toBe("riskli");
  });
});
