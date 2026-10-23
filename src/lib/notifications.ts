import "server-only";
import { listChats } from "./chat";
import { getDb } from "./db";
import { PRAISES } from "./praise";
import { getMvpWinners } from "./progress";

/*
 * Bildirimler (Hook modelinde "tetikleyici"): Ayrı bir bildirim tablosu tutulmaz; bildirimler veritabanındaki
 * gerçek olaylardan her açılışta üretilir. Böylece bir olay (ör. istek onayı) geri alınırsa bildirimi de kendiliğinden kalkar.
 * Yalnızca eyleme dönüşebilen olaylar bildirilir: katılma isteği, istek sonucu, okunmamış mesaj, değerlendirme hatırlatması,
 * yaklaşan maç, alınan övgüler ve MVP seçilmek. ("Giriş yaptın" gibi bilgi kirliliği yok.)
 */

export type NotificationKind = "request" | "decision" | "message" | "review" | "upcoming" | "praise" | "mvp";

export interface Notification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  href: string;
  at: string;
  unread: boolean;
}

const DAY = 86_400_000;

export async function listNotifications(playerId: string): Promise<Notification[]> {
  const db = await getDb();
  const [seen] = await db.query<{ ms: number | null }>(
    "SELECT (extract(epoch FROM notifications_seen_at) * 1000)::float8 AS ms FROM players WHERE id = $1",
    [playerId],
  );
  const seenAt = seen?.ms ?? 0; // hiç okunmadıysa hepsi yeni
  const items: Omit<Notification, "unread">[] = [];

  // 1. Organizatörü olduğum maçlara gelen bekleyen istekler
  const requests = await db.query<{ match_id: string; title: string; name: string; created_at: Date }>(
    `SELECT r.match_id, m.title, p.name, r.created_at FROM join_requests r
     JOIN matches m ON m.id = r.match_id JOIN players p ON p.id = r.player_id
     WHERE m.organizer_id = $1 AND r.status = 'pending' AND m.starts_at > now()`,
    [playerId],
  );
  for (const r of requests) {
    items.push({
      id: `req-${r.match_id}-${r.name}`,
      kind: "request",
      title: `${r.name} katılma isteği gönderdi`,
      body: `${r.title} · Güvenilirliğine bakıp onayla ya da reddet`,
      href: `/mac/${r.match_id}/istekler`,
      at: new Date(r.created_at).toISOString(),
    });
  }

  // 2. Benim isteklerimin sonucu (son 14 gün)
  const decisions = await db.query<{ match_id: string; title: string; status: string; decided_at: Date }>(
    `SELECT r.match_id, m.title, r.status, r.decided_at FROM join_requests r JOIN matches m ON m.id = r.match_id
     WHERE r.player_id = $1 AND r.status <> 'pending' AND r.decided_at > now() - interval '14 days'`,
    [playerId],
  );
  for (const d of decisions) {
    const ok = d.status === "approved";
    items.push({
      id: `dec-${d.match_id}`,
      kind: "decision",
      title: ok ? "Katılma isteğin onaylandı!" : "Katılma isteğin kabul edilmedi",
      body: ok ? `${d.title} kadrosundasın. Takım sohbetine katıl.` : `${d.title} · Başka bir maça göz at.`,
      href: ok ? `/sohbetler/${d.match_id}` : "/",
      at: new Date(d.decided_at).toISOString(),
    });
  }

  // 3. Okunmamış takım sohbeti mesajları
  for (const c of await listChats(playerId)) {
    if (c.unread > 0 && c.lastAt) {
      items.push({
        id: `msg-${c.matchId}`,
        kind: "message",
        title: `${c.title}: ${c.unread} yeni mesaj`,
        body: `${c.lastSender}: ${c.lastMessage}`,
        href: `/sohbetler/${c.matchId}`,
        at: c.lastAt,
      });
    }
  }

  // 4. Son 7 günde oynadığım ama değerlendirmediğim maçlar; 5. önümüzdeki 24 saatteki maçlarım
  const mine = await db.query<{ id: string; title: string; starts_at: Date; reviewed: boolean }>(
    `SELECT m.id, m.title, m.starts_at,
            EXISTS (SELECT 1 FROM match_reviews r WHERE r.match_id = m.id AND r.reviewer_id = $1) AS reviewed
     FROM match_participants mp JOIN matches m ON m.id = mp.match_id
     WHERE mp.player_id = $1 AND m.starts_at BETWEEN now() - interval '7 days' AND now() + interval '24 hours'`,
    [playerId],
  );
  const timeFmt = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit" });
  for (const m of mine) {
    const startsAt = new Date(m.starts_at);
    if (startsAt.getTime() > Date.now()) {
      items.push({
        id: `up-${m.id}`,
        kind: "upcoming",
        title: `Maçın yaklaşıyor: ${timeFmt.format(startsAt)}`,
        body: `${m.title} · Gelemeyeceksen şimdi ayrıl ki yerine biri girebilsin.`,
        href: `/mac/${m.id}`,
        at: new Date(startsAt.getTime() - DAY).toISOString(),
      });
    } else if (!m.reviewed) {
      items.push({
        id: `rev-${m.id}`,
        kind: "review",
        title: "Takımını değerlendir",
        body: `${m.title} · Kim geldi, kim parladı? (+10 XP / oyuncu)`,
        href: `/mac/${m.id}/degerlendir`,
        at: new Date(startsAt.getTime() + 2 * 3_600_000).toISOString(),
      });
    }
  }

  // 6. Son 30 günde aldığım övgüler (maç başına toplu; kimin verdiği gösterilmez)
  const praises = await db.query<{ match_id: string; title: string; praise_id: string; n: number; at: Date }>(
    `SELECT r.match_id, m.title, r.praise_id, count(*)::int AS n, max(r.created_at) AS at
     FROM match_reviews r JOIN matches m ON m.id = r.match_id
     WHERE r.target_id = $1 AND r.praise_id IS NOT NULL AND r.created_at > now() - interval '30 days'
     GROUP BY r.match_id, m.title, r.praise_id`,
    [playerId],
  );
  const byMatch = new Map<string, { title: string; at: number; parts: string[]; total: number }>();
  for (const p of praises) {
    const praise = PRAISES.find((x) => x.id === p.praise_id);
    const entry = byMatch.get(p.match_id) ?? { title: p.title, at: 0, parts: [], total: 0 };
    entry.at = Math.max(entry.at, new Date(p.at).getTime());
    entry.total += p.n;
    entry.parts.push(`${praise?.emoji ?? ""} ${praise?.label ?? p.praise_id}${p.n > 1 ? ` ×${p.n}` : ""}`);
    byMatch.set(p.match_id, entry);
  }
  for (const [matchId, e] of byMatch) {
    items.push({
      id: `pr-${matchId}`,
      kind: "praise",
      title: `${e.total} övgü aldın!`,
      body: `${e.title} · ${e.parts.join(", ")}`,
      href: "/profil",
      at: new Date(e.at).toISOString(),
    });
  }

  // 7. MVP seçildiğim maçlar (son 30 gün)
  const wins = (await getMvpWinners({ from: new Date(Date.now() - 30 * DAY), to: new Date() })).filter((w) => w.playerId === playerId);
  if (wins.length > 0) {
    const rows = await db.query<{ id: string; title: string; starts_at: Date }>("SELECT id, title, starts_at FROM matches WHERE id = ANY($1)", [
      wins.map((w) => w.matchId),
    ]);
    for (const m of rows) {
      items.push({
        id: `mvp-${m.id}`,
        kind: "mvp",
        title: "Maçın Oyuncusu seçildin! 👑",
        body: `${m.title} · +25 XP`,
        href: "/profil",
        at: new Date(new Date(m.starts_at).getTime() + 3 * 3_600_000).toISOString(),
      });
    }
  }

  return items
    .sort((a, b) => b.at.localeCompare(a.at))
    .map((n) => ({ ...n, unread: new Date(n.at).getTime() > seenAt }));
}

/** "Tümünü okundu işaretle" */
export async function markNotificationsSeen(playerId: string) {
  const db = await getDb();
  await db.query("UPDATE players SET notifications_seen_at = now() WHERE id = $1", [playerId]);
}
