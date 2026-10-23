import Link from "next/link";
import { Bell, MapPin, Users } from "lucide-react";
import { Avatar } from "@/components/ui";
import { MatchFeed } from "@/components/MatchFeed";
import { QadroMap } from "@/components/map/QadroMap";
import { listMatches } from "@/lib/matches";
import { listNotifications } from "@/lib/notifications";
import { matchPins } from "@/lib/pins";
import { requireViewer } from "@/lib/session";

// Maçlar veritabanından her istekte okunur (SSR); filtreleme tarayıcıda (CSR).
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const viewer = await requireViewer();
  const [matches, notifications] = await Promise.all([listMatches(viewer.id), listNotifications(viewer.id)]);
  const unread = notifications.filter((n) => n.unread).length;
  const missingPlayers = matches.reduce((sum, m) => sum + Math.max(0, m.capacity - m.joined), 0);

  return (
    <div className="px-5 pt-6 lg:mx-auto lg:max-w-6xl lg:px-10 lg:pt-10">
      <header className="flex items-center justify-between">
        <Link href="/profil" className="flex items-center gap-3">
          <Avatar player={viewer} size={42} />
          <div className="leading-tight">
            <p className="text-xs text-muted">Selam,</p>
            <p className="text-lg font-bold lg:text-2xl">{viewer.name.split(" ")[0]}!</p>
          </div>
        </Link>
        <Link
          href="/bildirimler"
          aria-label={unread ? `Bildirimler (${unread} yeni)` : "Bildirimler"}
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface"
        >
          <Bell size={18} />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>
      </header>

      {/* Geniş ekranda (xl) iki kolon: solda maçlar, sağda harita ve özet. Daha dar ekranlarda tek kolon. */}
      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-8">
        <div>
          <MatchFeed matches={matches} viewerLevel={viewer.level} />
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-8 mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-line bg-surface p-4">
                <MapPin size={18} className="text-muted" />
                <p className="mt-2 text-3xl font-bold tabular-nums">{matches.length}</p>
                <p className="text-xs text-muted">Açık maç</p>
              </div>
              <div className="rounded-2xl border border-line bg-surface p-4">
                <Users size={18} className="text-muted" />
                <p className="mt-2 text-3xl font-bold tabular-nums">{missingPlayers}</p>
                <p className="text-xs text-muted">Oyuncu aranıyor</p>
              </div>
            </div>
            <div className="h-80 overflow-hidden rounded-2xl border border-line">
              <QadroMap center={[37.9, 37.05]} zoom={8} pins={matchPins(matches)} />
            </div>
            <Link href="/kesfet" className="block text-center text-sm font-semibold text-primary">
              Haritada keşfet →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
