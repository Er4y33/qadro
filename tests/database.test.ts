/**
 * Veritabanı senaryoları: bellekte çalışan PGlite (gerçek PostgreSQL) üzerinde uçtan uca kurallar.
 * Her şey örnek verilerle (seed) başlar: "elbistan-basket" 3v3, 6 kişilik, 4 oyuncu kayıtlı, organizatörü Ahmet.
 */
import { describe, expect, it } from "vitest";
import { authenticate, registerPlayer } from "@/lib/auth";
import { createMatch, getMatch, joinMatch, leaveMatch, listMatches } from "@/lib/matches";
import { submitReviews } from "@/lib/reviews";
import { getMatchHistory } from "@/lib/history";
import { createTeam, deleteTeam, inviteTeam, listTeams } from "@/lib/teams";
import { getMessages } from "@/lib/chat";
import { listNotifications } from "@/lib/notifications";
import { answerSos, createSos } from "@/lib/sos";

describe("Maça katılma ve kontenjan", () => {
  it("son iki yer dolunca üçüncü oyuncu 'dolu' yanıtı alır (API 409)", async () => {
    expect(await joinMatch("elbistan-basket", "emre")).toBe("joined");
    expect(await joinMatch("elbistan-basket", "yusuf")).toBe("joined");
    expect(await joinMatch("elbistan-basket", "kerem")).toBe("full");
    expect((await getMatch("elbistan-basket"))?.joined).toBe(6);
  });

  it("aynı oyuncu iki kez katılamaz", async () => {
    expect(await joinMatch("elbistan-basket", "emre")).toBe("already_joined");
  });

  it("aynı anda gelen katılma isteklerinde kontenjan aşılmaz", async () => {
    // Turnuva antrenmanı: 10 kişilik, 8 kayıtlı → 2 boş yer, 5 oyuncu aynı anda deniyor.
    // Not: PGlite istekleri sıraya koyar; bu test kontenjan kontrolünün SQL cümlesinin içinde yapıldığını doğrular.
    const results = await Promise.all(["can", "burak", "mert", "emre", "baris"].map((p) => joinMatch("turnuva-antrenmani", p)));
    expect(results.filter((r) => r === "joined")).toHaveLength(2);
    expect((await getMatch("turnuva-antrenmani"))?.joined).toBe(10);
  });

  it("olmayan maç 'bulunamadı' döner (API 404)", async () => {
    expect(await joinMatch("olmayan-mac", "emre")).toBe("not_found");
  });

  it("organizatör kendi maçından ayrılamaz, kadroda olmayan ayrılamaz", async () => {
    expect(await leaveMatch("elbistan-basket", "ahmet")).toBe("organizer");
    expect(await leaveMatch("elbistan-basket", "kerem")).toBe("not_member");
    expect(await leaveMatch("elbistan-basket", "emre")).toBe("left");
  });
});

describe("Maç oluşturma", () => {
  it("organizatör kadroya ilk oyuncu olarak eklenir ve gizli maç yalnızca ona görünür", async () => {
    const id = await createMatch(
      {
        title: "Gizli Tenis",
        sport: "tenis",
        format: "Tekler",
        venueId: "elbistan-tenis",
        startsAt: new Date(Date.now() + 2 * 86_400_000).toISOString(),
        price: 0,
        minLevel: 1,
        isPublic: false,
        requiresApproval: false,
        note: "",
      },
      "oguz",
    );
    const match = await getMatch(id);
    expect(match?.capacity).toBe(2);
    expect(match?.participants.map((p) => p.id)).toEqual(["oguz"]);
    expect((await listMatches("oguz")).some((m) => m.id === id)).toBe(true);
    expect((await listMatches("can")).some((m) => m.id === id)).toBe(false);
  });
});

describe("Kayıt ve giriş", () => {
  it("aynı e-postayla ikinci kayıt reddedilir (API 409)", async () => {
    expect(await registerPlayer("Test Oyuncu", "test@qadro.app", "sifre12345")).toMatch(/^u-/);
    expect(await registerPlayer("Başka Biri", "test@qadro.app", "sifre12345")).toBeNull();
  });

  it("yanlış şifreyle giriş yapılamaz (API 401), e-posta büyük/küçük harf duyarsızdır", async () => {
    expect(await authenticate("test@qadro.app", "yanlis-sifre")).toBeNull();
    expect(await authenticate("TEST@qadro.app", "sifre12345")).toMatch(/^u-/);
    expect(await authenticate("kimse@qadro.app", "sifre12345")).toBeNull();
  });
});

describe("Maç sonu değerlendirmesi", () => {
  const PAST = "gecen-hafta-hali-saha"; // 2 gün önce oynanmış örnek maç, Atahan kadroda

  it("maçta oynamayan değerlendiremez (API 403)", async () => {
    const result = await submitReviews(PAST, "enes", [{ playerId: "ahmet", attended: true, praiseId: null }]);
    expect(result).toMatchObject({ ok: false, status: 403 });
  });

  it("henüz oynanmamış maç değerlendirilemez (API 409)", async () => {
    const result = await submitReviews("cuma-aksami-hali-saha", "ahmet", [{ playerId: "can", attended: true, praiseId: null }]);
    expect(result).toMatchObject({ ok: false, status: 409 });
  });

  it("kadroda olmayan oyuncu listeye eklenirse istek reddedilir (API 400)", async () => {
    const result = await submitReviews(PAST, "atahan", [{ playerId: "enes", attended: true, praiseId: null }]);
    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it("başka branşın övgüsü verilemez: futbol maçında 'Keskin Şutör' reddedilir (API 400)", async () => {
    const result = await submitReviews(PAST, "atahan", [{ playerId: "ahmet", attended: true, praiseId: "keskin-sutor" }]);
    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it("geçerli değerlendirme kaydedilir, ikinci kez gönderilemez", async () => {
    const reviews = [
      { playerId: "ahmet", attended: true, praiseId: "centilmen" },
      { playerId: "onur", attended: false, praiseId: null },
    ];
    expect(await submitReviews(PAST, "atahan", reviews)).toMatchObject({ ok: true });
    expect(await submitReviews(PAST, "atahan", reviews)).toMatchObject({ ok: false, status: 409 });
  });
});

describe("Maç Geçmişi", () => {
  it("oynanmış maçlar en yeniden eskiye gelir; durum oylardan, övgü toplamı maçlardan hesaplanır", async () => {
    const history = await getMatchHistory("atahan");
    expect(history.total).toBeGreaterThan(0);
    const dates = history.entries.map((e) => e.startsAt);
    expect([...dates].sort().reverse()).toEqual(dates);
    expect(history.praisesReceived).toBe(history.entries.reduce((s, e) => s + e.praises.reduce((t, p) => t + p.count, 0), 0));
    expect(history.entries.every((e) => ["confirmed", "pending", "no_show"].includes(e.outcome))).toBe(true);
  });

  it("branş filtresi yalnızca o branşın maçlarını gösterir", async () => {
    const basket = await getMatchHistory("atahan", "basketbol");
    expect(basket.entries.every((e) => e.sport === "basketbol")).toBe(true);
  });
});

describe("S.O.S çağrısı", () => {
  it("çağrıyı yalnızca kadrodaki oyuncu açabilir (API 403)", async () => {
    expect(await createSos("plaj-voleybolu", "enes", "Libero")).toMatchObject({ ok: false, status: 403 });
  });

  it("branşa uymayan mevki reddedilir (API 400)", async () => {
    expect(await createSos("plaj-voleybolu", "can", "Kaleci")).toMatchObject({ ok: false, status: 400 });
  });

  it("çağrıyı kabul eden kadroya girer; ikinci kişi aynı çağrıyı alamaz", async () => {
    const created = await createSos("plaj-voleybolu", "can", "Libero");
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    expect(await createSos("plaj-voleybolu", "can", "Pasör")).toMatchObject({ ok: false, status: 409 }); // tek açık çağrı

    const first = await answerSos(created.id, "enes");
    expect(first).toMatchObject({ ok: true, matchId: "plaj-voleybolu" });
    expect((await getMatch("plaj-voleybolu"))?.participants.some((p) => p.id === "enes")).toBe(true);

    expect(await answerSos(created.id, "furkan")).toMatchObject({ ok: false, status: 409 });
  });

  it("çağrıyı açan kişi kendi çağrısını kabul edemez", async () => {
    const created = await createSos("plaj-voleybolu", "can", "Smaçör");
    if (!created.ok) throw new Error(created.error);
    expect(await answerSos(created.id, "can")).toMatchObject({ ok: false, status: 409 });
  });
});

describe("Takımlar (kayıtlı kadrolar)", () => {
  const newMatch = (organizer: string) =>
    createMatch(
      {
        title: "Takım Maçı",
        sport: "futbol",
        format: "5v5",
        venueId: "elbistan-sentetik",
        startsAt: new Date(Date.now() + 3 * 86_400_000).toISOString(),
        price: 0,
        minLevel: 1,
        isPublic: true,
        requiresApproval: false,
        note: "",
      },
      organizer,
    );

  it("takıma yalnızca birlikte oynanan oyuncular eklenebilir (spam engeli, API 400)", async () => {
    const stranger = (await registerPlayer("Yabancı Biri", "yabanci@qadro.app", "sifre12345"))!;
    expect(await createTeam("atahan", { name: "Deneme", sport: "futbol", memberIds: [stranger] })).toMatchObject({ ok: false, status: 400 });
  });

  it("takımla davet: üyelere davet gider, kadrodakilere gitmez; davetliler sohbeti görür ve bildirim alır", async () => {
    const created = await createTeam("atahan", { name: "Perşembe Ekibi", sport: "futbol", memberIds: ["ahmet", "can"] });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect((await listTeams("ahmet")).some((t) => t.id === created.id)).toBe(true); // üye de takımı görür

    const matchId = await newMatch("atahan");
    await joinMatch(matchId, "can"); // Can zaten kadroda: davet almaz
    expect(await inviteTeam(matchId, created.id, "ahmet")).toMatchObject({ ok: false, status: 403 }); // organizatör değil
    expect(await inviteTeam(matchId, created.id, "atahan")).toEqual({ ok: true, invited: 1 });

    expect((await getMessages(matchId, "ahmet")).ok).toBe(true); // davetli sohbeti okur
    expect((await getMessages(matchId, "burak")).ok).toBe(false); // davetsiz okuyamaz
    expect((await listNotifications("ahmet")).some((n) => n.kind === "invite" && n.href === `/mac/${matchId}`)).toBe(true);
  });

  it("takımı yalnızca kurucusu silebilir", async () => {
    const created = await createTeam("atahan", { name: "Silinecek Ekip", sport: "futbol", memberIds: ["ahmet"] });
    if (!created.ok) throw new Error("takım oluşmadı");
    expect(await deleteTeam(created.id, "ahmet")).toMatchObject({ ok: false, status: 403 });
    expect(await deleteTeam(created.id, "atahan")).toEqual({ ok: true });
  });
});
