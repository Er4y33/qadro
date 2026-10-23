import Link from "next/link";
import { Bell, CalendarClock, ChevronLeft, Crown, Handshake, MessageSquare, Sparkles, UserCheck, UserPlus } from "lucide-react";
import { cn } from "@/components/ui";
import { MarkAllRead } from "@/components/MarkAllRead";
import { listNotifications, type Notification, type NotificationKind } from "@/lib/notifications";
import { SosInbox } from "@/components/SosInbox";
import { BADGES } from "@/lib/badges";
import { getProfile } from "@/lib/players";
import { requireViewer } from "@/lib/session";
import { listOpenSos } from "@/lib/sos";

// Açık S.O.S çağrıları her açılışta veritabanından okunur
export const dynamic = "force-dynamic";

/**
 * Bildirimler. Hook modelindeki "tetikleyici" adımıdır: kullanıcıyı uygulamaya geri getiren dış uyaran.
 * Bildirimler yalnızca eyleme dönüşebilen olaylar için gönderilir (S.O.S, davet, övgü, puan değişimi).
 * S.O.S çağrıları src/lib/sos.ts'ten, diğer bildirimler src/lib/notifications.ts'ten gelir (hepsi veritabanındaki gerçek olaylar).
 */
export default async function NotificationsPage() {
  const viewer = await requireViewer();
  const [calls, profile, notifications] = await Promise.all([listOpenSos(viewer.id), getProfile(viewer), listNotifications(viewer.id)]);
  const fresh = notifications.filter((n) => n.unread);
  const old = notifications.filter((n) => !n.unread).slice(0, 15);
  const rescuer = BADGES.find((b) => b.id === "kurtarici")!;
  return (
    <main className="flex-1 px-5 pt-5 pb-10">
      <header className="grid grid-cols-[40px_1fr_40px] items-center">
        <Link href="/" aria-label="Geri" className="flex h-10 w-10 items-center justify-center rounded-full bg-surface">
          <ChevronLeft size={22} />
        </Link>
        <h1 className="text-center text-lg font-bold">Bildirimler</h1>
        <MarkAllRead disabled={fresh.length === 0} />
      </header>

      <h2 className="mt-8 mb-3 flex items-center gap-2 text-xs font-bold tracking-wide text-muted">
        S.O.S ÇAĞRILARI <span className="rounded-md bg-danger/15 px-1.5 text-danger">{calls.length}</span>
      </h2>
      <SosInbox calls={calls} rescuerProgress={{ current: profile.stats.sosAnswered, target: rescuer.target }} />

      <h2 className="mt-8 mb-3 flex items-center gap-2 text-xs font-bold tracking-wide text-muted">
        YENİ <span className="rounded-md bg-primary/15 px-1.5 text-primary">{fresh.length}</span>
      </h2>
      <NotificationList items={fresh} empty="Yeni bildirim yok." />

      {old.length > 0 && (
        <>
          <h2 className="mt-8 mb-3 text-xs font-bold tracking-wide text-muted">ÖNCEKİLER</h2>
          <NotificationList items={old} />
        </>
      )}
    </main>
  );
}

const ICONS: Record<NotificationKind, { icon: typeof Bell; tone: string }> = {
  request: { icon: UserPlus, tone: "border-info/50 bg-info/10 text-info" },
  decision: { icon: UserCheck, tone: "border-success/50 bg-success/10 text-success" },
  message: { icon: MessageSquare, tone: "border-primary/50 bg-primary/10 text-primary" },
  review: { icon: Handshake, tone: "border-warning/50 bg-warning/10 text-warning" },
  upcoming: { icon: CalendarClock, tone: "border-primary/50 bg-primary/10 text-primary" },
  praise: { icon: Sparkles, tone: "border-warning/50 bg-warning/10 text-warning" },
  mvp: { icon: Crown, tone: "border-warning/50 bg-warning/10 text-warning" },
};

const TZ = "Europe/Istanbul";
function when(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return "Yakında";
  if (diff < 3_600_000) return `${Math.max(1, Math.round(diff / 60_000))} dk`;
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)} sa`;
  return new Intl.DateTimeFormat("tr-TR", { timeZone: TZ, day: "numeric", month: "short" }).format(new Date(iso));
}

function NotificationList({ items, empty }: { items: Notification[]; empty?: string }) {
  if (items.length === 0) return empty ? <p className="rounded-2xl border border-dashed border-line p-5 text-center text-sm text-muted">{empty}</p> : null;
  return (
    <ul className="space-y-3">
      {items.map((n) => {
        const { icon: Icon, tone } = ICONS[n.kind];
        return (
          <li key={n.id}>
            <Link href={n.href} className={cn("flex gap-3 rounded-2xl border border-line bg-surface p-4", !n.unread && "opacity-70")}>
              <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border", tone)}>
                <Icon size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2">
                  <span className="font-semibold">{n.title}</span>
                  <span className="flex shrink-0 items-center gap-2 text-[11px] text-muted">
                    {when(n.at)}
                    {n.unread && <span className="h-2 w-2 rounded-full bg-primary" aria-label="Okunmadı" />}
                  </span>
                </span>
                <span className="block truncate text-xs text-muted">{n.body}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
