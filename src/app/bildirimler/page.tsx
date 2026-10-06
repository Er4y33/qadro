import Link from "next/link";
import { CheckCheck, ChevronLeft, Star } from "lucide-react";
import { Avatar, cn } from "@/components/ui";
import { players } from "@/lib/mock-data";

/**
 * Bildirimler. Hook modelindeki "tetikleyici" adımıdır: kullanıcıyı uygulamaya geri getiren dış uyaran.
 * Bildirimler yalnızca eyleme dönüşebilen olaylar için gönderilir (S.O.S, davet, övgü, puan değişimi).
 */
export default function NotificationsPage() {
  return (
    <main className="flex-1 px-5 pt-5 pb-10">
      <header className="grid grid-cols-[40px_1fr_40px] items-center">
        <Link href="/" aria-label="Geri" className="flex h-10 w-10 items-center justify-center rounded-full bg-surface">
          <ChevronLeft size={22} />
        </Link>
        <h1 className="text-center text-lg font-bold">Bildirimler</h1>
        <button type="button" aria-label="Tümünü okundu işaretle" className="flex justify-end text-primary">
          <CheckCheck size={22} />
        </button>
      </header>

      <h2 className="mt-8 mb-3 flex items-center gap-2 text-xs font-bold tracking-wide text-muted">
        YENİ <span className="rounded-md bg-primary/15 px-1.5 text-primary">3</span>
      </h2>

      <ul className="space-y-3">
        {/* S.O.S */}
        <li>
          <Link
            href="/sos?mac=cuma-aksami-hali-saha"
            className="flex gap-3 rounded-2xl border-2 border-danger/70 bg-danger/10 p-4"
          >
            <span className="relative mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-dashed border-danger/60">
              <span className="h-3 w-3 animate-pulse rounded-full bg-danger" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold">Acil Kaleci Aranıyor!</p>
                <span className="text-[11px] font-bold text-danger">ŞİMDİ</span>
              </div>
              <p className="text-xs text-muted">Onikişubat Tesisleri • Başlamasına 45 dk var</p>
              <p className="mt-2 text-xs font-bold text-danger">S.O.S KARTINI GÖR →</p>
            </div>
          </Link>
        </li>

        {/* Davet */}
        <li className="flex gap-3 rounded-2xl border border-line bg-surface p-4">
          <Avatar player={players.ahmet} size={36} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold">Ahmet seni bir maça davet etti</p>
              <UnreadDot />
            </div>
            <p className="text-xs text-muted">Cuma Akşamı Halı Saha • 7v7</p>
            <div className="mt-3 flex gap-2">
              <Link
                href="/mac/cuma-aksami-hali-saha"
                className="rounded-lg bg-primary px-5 py-1.5 text-xs font-bold text-on-primary"
              >
                Katıl
              </Link>
              <button type="button" className="rounded-lg border border-line px-4 py-1.5 text-xs font-semibold">
                Reddet
              </button>
            </div>
          </div>
        </li>

        {/* Övgü */}
        <li className="flex gap-3 rounded-2xl border border-line bg-surface p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-warning/50 bg-warning/10 text-lg">
            🧱
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold">Yeni bir övgü aldın!</p>
              <span className="flex items-center gap-2 text-[11px] text-muted">
                1 sa <UnreadDot />
              </span>
            </div>
            <p className="text-xs text-muted">
              Eray sana <span className="font-semibold text-warning">Kaya Gibi</span> övgüsü verdi.
            </p>
          </div>
        </li>
      </ul>

      <h2 className="mt-8 mb-3 text-xs font-bold tracking-wide text-muted">ÖNCEKİLER</h2>
      <ul>
        <li className={cn("flex gap-3 rounded-2xl border border-line bg-surface p-4 opacity-70")}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-warning">
            <Star size={16} fill="currentColor" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold">Güvenilirlik puanın güncellendi</p>
              <span className="text-[11px] text-muted">Dün</span>
            </div>
            <p className="text-xs text-muted">Son maçın ardından puanın 4.8 oldu.</p>
          </div>
        </li>
      </ul>
    </main>
  );
}

function UnreadDot() {
  return <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Okunmadı" />;
}
