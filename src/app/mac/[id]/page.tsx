import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, MessageSquare, Plus, Share2 } from "lucide-react";
import { Avatar, ScreenHeader, cn } from "@/components/ui";
import { MatchActions } from "@/components/MatchActions";
import { QadroMap } from "@/components/map/QadroMap";
import { getVenue } from "@/lib/mock-data";
import { getMatch } from "@/lib/matches";
import { requireViewer } from "@/lib/session";
import { SPORT_LABELS } from "@/lib/types";

/*
 * Render stratejisi: SSR (her istekte sunucuda üretilir).
 * Paylaşılan maç linklerinin her zaman güncel kontenjanı göstermesi gerekir; veri her istekte veritabanından okunur.
 */
export const dynamic = "force-dynamic";

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await requireViewer();
  const match = await getMatch(id);
  if (!match) notFound();
  const venue = getVenue(match.venueId);

  const joined = match.participants.some((p) => p.id === viewer.id);
  const isOrganizer = match.organizer.id === viewer.id;
  const openSlots = match.capacity - match.joined;

  return (
    <>
      <main className="flex-1 pb-32">
        <ScreenHeader
          title="Maç Detayı"
          backHref="/"
          right={
            <button type="button" aria-label="Paylaş" className="flex h-10 w-10 items-center justify-center text-muted">
              <Share2 size={20} />
            </button>
          }
        />

        <div className="px-5">
          {/* Küçük, dokunulamayan harita önizlemesi; dokununca Saha Konumu ekranı açılır */}
          {venue && (
            <Link
              href={`/saha/${venue.id}?mac=${match.id}`}
              aria-label={`${venue.name} konumunu aç`}
              className="relative block h-40 overflow-hidden rounded-2xl border border-line"
            >
              <QadroMap center={[venue.lat, venue.lng]} zoom={15} interactive={false} pins={[{ id: venue.id, lat: venue.lat, lng: venue.lng }]} />
              <span className="absolute inset-0 z-[500]" />
            </Link>
          )}

          <p className="mt-5 text-sm font-semibold text-success">
            {SPORT_LABELS[match.sport]} • {match.format}
          </p>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            {match.title}
            {!match.isPublic && <Lock size={18} className="text-muted" aria-label="Gizli maç" />}
          </h1>

          <div className="mt-4 grid grid-cols-[1fr_1.25fr_0.8fr] gap-2">
            <InfoTile label={match.dayLabel} value={match.time} />
            <InfoTile label="Konum" value={match.venueShort} />
            <InfoTile label="Ücret" value={`₺${match.pricePerPerson}`} />
          </div>

          <h2 className="mt-6 mb-2 font-bold">Organizatör</h2>
          <div className="flex items-center gap-3 rounded-full border border-line bg-surface p-2 pr-3">
            <Avatar player={match.organizer} size={40} />
            <div className="flex-1">
              <p className="font-semibold">{match.organizer.name}</p>
              <p className="text-xs text-muted">
                Lvl. {match.organizer.level} • {match.organizer.rating.toFixed(1)} Yıldız
              </p>
            </div>
            <Link
              href={`/sohbetler/${match.id}`}
              aria-label="Organizatöre yaz"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-on-primary"
            >
              <MessageSquare size={15} />
            </Link>
          </div>

          <h2 className="mt-6 mb-2 font-bold">
            Katılımcılar ({match.joined}/{match.capacity})
          </h2>
          <div className="flex flex-wrap items-center gap-y-2">
            {/* Kullanıcı kadrodaysa en başta görünsün */}
            {[...match.participants]
              .sort((a, b) => Number(b.id === viewer.id) - Number(a.id === viewer.id))
              .slice(0, 5)
              .map((p, i) => (
              <Avatar
                key={p.id}
                player={p}
                size={40}
                className={cn("border-2 border-bg", i > 0 && "-ml-2", p.id === viewer.id && "ring-2 ring-primary")}
              />
            ))}
            {match.participants.length > 5 && (
              <span className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full border-2 border-bg bg-surface-2 text-xs font-semibold">
                +{match.participants.length - 5}
              </span>
            )}
            {Array.from({ length: Math.min(Math.max(0, openSlots), 4) }).map((_, i) =>
              !joined && match.sport === "futbol" ? (
                <Link
                  key={i}
                  href={`/mac/${match.id}/dizilim`}
                  aria-label="Boş yere katıl"
                  className="ml-3 flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-danger text-danger"
                >
                  <Plus size={16} />
                </Link>
              ) : (
                <span key={i} className="ml-3 h-10 w-10 rounded-full border-2 border-dashed border-danger/60" aria-hidden />
              ),
            )}
          </div>

          {openSlots > 0 && (
            <Link
              href={`/sos?mac=${match.id}`}
              className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-danger/50 bg-danger/10 px-4 py-3"
            >
              <span className="text-sm font-semibold">{openSlots} kişi eksik, maç yaklaşıyor mu?</span>
              <span className="shrink-0 text-xs font-bold whitespace-nowrap text-danger">S.O.S BAŞLAT →</span>
            </Link>
          )}

          {match.note && (
            <>
              <h2 className="mt-6 mb-2 font-bold">Maç Notu</h2>
              <p className="rounded-xl border border-line bg-surface p-3 text-sm text-muted italic">“{match.note}”</p>
            </>
          )}
        </div>
      </main>

      <MatchActions
        matchId={match.id}
        sport={match.sport}
        joined={joined}
        isOrganizer={isOrganizer}
        full={openSlots <= 0}
      />
    </>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2.5">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="truncate font-bold">{value}</p>
    </div>
  );
}

