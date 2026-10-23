/**
 * Yeni özelliklerin veritabanı senaryoları (bellekte PGlite):
 * işlem (transaction) geri alma, takım sohbeti, onaylı katılım, giriş deneme sınırı, hesap silme,
 * bildirimler ve oylardan hesaplanan şehir sıralaması.
 */
import { describe, expect, it } from "vitest";
import { authenticate, deleteAccount, loginBlocked, recordFailedLogin, registerPlayer, updateName, type Viewer } from "@/lib/auth";
import { getMessages, listChats, sendMessage } from "@/lib/chat";
import { getDb } from "@/lib/db";
import { getCityLeaderboard } from "@/lib/leaderboard-data";
import { getMatch } from "@/lib/matches";
import { listNotifications } from "@/lib/notifications";
import { decideRequest, listRequests, removeParticipant, requestToJoin } from "@/lib/requests";

const viewerOf = async (id: string): Promise<Viewer> => {
  const db = await getDb();
  const [row] = await db.query<Viewer>("SELECT id, name, initials, color, level, rating, email FROM players WHERE id = $1", [id]);
  return row;
};

describe("İşlem (transaction)", () => {
  it("işlemin ortasında hata olursa önceki adımlar da geri alınır", async () => {
    const db = await getDb();
    await expect(
      db.transaction(async (tx) => {
        await tx.query("INSERT INTO messages (match_id, sender_id, body) VALUES ('elbistan-basket', 'ahmet', 'yarım kalacak')");
        throw new Error("bağlantı koptu");
      }),
    ).rejects.toThrow("bağlantı koptu");
    const rows = await db.query("SELECT 1 FROM messages WHERE body = 'yarım kalacak'");
    expect(rows).toHaveLength(0);
  });
});

describe("Takım sohbeti", () => {
  it("kadroda olmayan okuyamaz ve yazamaz (API 403), olmayan maç 404", async () => {
    expect(await getMessages("elbistan-basket", "oguz")).toMatchObject({ ok: false, status: 403 });
    expect(await sendMessage("elbistan-basket", "oguz", "selam")).toMatchObject({ ok: false, status: 403 });
    expect(await getMessages("olmayan", "ahmet")).toMatchObject({ ok: false, status: 404 });
  });

  it("boş ve 500 karakterden uzun mesaj reddedilir (API 400)", async () => {
    expect(await sendMessage("elbistan-basket", "ahmet", "   ")).toMatchObject({ ok: false, status: 400 });
    expect(await sendMessage("elbistan-basket", "ahmet", "x".repeat(501))).toMatchObject({ ok: false, status: 400 });
  });

  it("gönderilen mesaj 'after' sorgusunda gelir ve diğer üyede okunmamış sayılır", async () => {
    const sent = await sendMessage("elbistan-basket", "ahmet", "  Top bende  ");
    if (!sent.ok) throw new Error(sent.error);
    expect(sent.message.body).toBe("Top bende");
    const fresh = await getMessages("elbistan-basket", "furkan", sent.message.id - 1);
    expect(fresh.ok && fresh.messages.map((m) => m.body)).toEqual(["Top bende"]);

    // Furkan mesajı okudu; kadrodaki Barış için hâlâ okunmamış
    expect((await listChats("baris")).find((c) => c.matchId === "elbistan-basket")?.unread).toBe(1);
    expect((await listChats("furkan")).find((c) => c.matchId === "elbistan-basket")?.unread).toBe(0);
  });
});

describe("Onaylı katılım (İstekleri Yönet)", () => {
  const match = "atahan-pazar-maci"; // organizatör Atahan, örnek veride 3 bekleyen istek var

  it("istekleri yalnızca organizatör görür ve yönetir (API 403)", async () => {
    expect(await listRequests(match, "mert")).toMatchObject({ ok: false, status: 403 });
    expect(await decideRequest(match, "mert", "furkan", "approve")).toMatchObject({ ok: false, status: 403 });
    const list = await listRequests(match, "atahan");
    expect(list.ok && list.requests.map((r) => r.playerId).sort()).toEqual(["enes", "furkan", "onur"]);
  });

  it("organizatör, gelmediği maçları görerek karar verir: Onur'un güvenilirliği düşüktür", async () => {
    const list = await listRequests(match, "atahan");
    if (!list.ok) throw new Error(list.error);
    const onur = list.requests.find((r) => r.playerId === "onur")!;
    const furkan = list.requests.find((r) => r.playerId === "furkan")!;
    expect(onur.noShows).toBeGreaterThan(0);
    expect(onur.reliability).toBeLessThan(furkan.reliability);
  });

  it("onaylanan oyuncu kadroya girer; reddedilen tekrar istek atamaz", async () => {
    expect(await decideRequest(match, "atahan", "furkan", "approve")).toEqual({ ok: true });
    expect((await getMatch(match))?.participants.some((p) => p.id === "furkan")).toBe(true);

    expect(await decideRequest(match, "atahan", "onur", "decline")).toEqual({ ok: true });
    expect(await requestToJoin(match, "onur")).toBe("declined_before");
    expect(await decideRequest(match, "atahan", "onur", "approve")).toMatchObject({ ok: false, status: 404 });
  });

  it("aynı oyuncu ikinci kez istek atamaz, geçersiz karar 400 döner", async () => {
    expect(await requestToJoin(match, "yusuf")).toBe("requested");
    expect(await requestToJoin(match, "yusuf")).toBe("already_requested");
    expect(await decideRequest(match, "atahan", "yusuf", "belki")).toMatchObject({ ok: false, status: 400 });
  });

  it("organizatör kadrodan oyuncu çıkarabilir ama kendini çıkaramaz", async () => {
    expect(await removeParticipant(match, "atahan", "furkan")).toEqual({ ok: true });
    expect(await removeParticipant(match, "atahan", "atahan")).toMatchObject({ ok: false, status: 409 });
    expect(await removeParticipant(match, "mert", "kerem")).toMatchObject({ ok: false, status: 403 });
  });

  it("organizatör bekleyen istekleri bildirim olarak görür", async () => {
    const notes = await listNotifications("atahan");
    expect(notes.some((n) => n.kind === "request" && n.href === `/mac/${match}/istekler`)).toBe(true);
  });
});

describe("Giriş deneme sınırı ve hesap ayarları", () => {
  it("aynı e-postaya 5 hatalı denemeden sonra giriş kilitlenir (API 429)", async () => {
    expect(await loginBlocked("hedef@qadro.com", "1.1.1.1")).toBe(false);
    for (let i = 0; i < 5; i++) await recordFailedLogin("Hedef@Qadro.com", `10.0.0.${i}`);
    expect(await loginBlocked("hedef@qadro.com", "9.9.9.9")).toBe(true);
    expect(await loginBlocked("baska@qadro.com", "9.9.9.9")).toBe(false);
  });

  it("demo hesabının adı değiştirilemez ve silinemez (API 403)", async () => {
    const demo = await viewerOf("atahan");
    expect(await updateName(demo, "Yeni Ad")).toMatchObject({ ok: false, status: 403 });
    expect(await deleteAccount(demo, "x")).toMatchObject({ ok: false, status: 403 });
  });

  it("silinen hesap anonimleşir ve bir daha giriş yapamaz", async () => {
    const id = (await registerPlayer("Silinecek Kişi", "sil@qadro.com", "sifre1234"))!;
    const me = await viewerOf(id);
    expect(await deleteAccount(me, "yanlis-sifre")).toMatchObject({ ok: false, status: 401 });
    expect(await deleteAccount(me, "sifre1234")).toEqual({ ok: true });
    expect((await viewerOf(id)).name).toBe("Silinmiş Oyuncu");
    expect(await authenticate("sil@qadro.com", "sifre1234")).toBeNull();
  });
});

describe("Şehrin En İyileri (oylardan)", () => {
  it("yalnızca maçı onaylanan oyuncular listelenir; sık gelmeyen oyuncunun puanı düşüktür", async () => {
    const entries = await getCityLeaderboard();
    expect(entries.length).toBeGreaterThan(5);
    expect(entries.every((e) => e.matches > 0 && e.rating >= 0 && e.rating <= 5)).toBe(true);
    const onur = entries.find((e) => e.id === "onur")!;
    const can = entries.find((e) => e.id === "can")!;
    expect(onur.rating).toBeLessThan(can.rating);
  });
});
