import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheck, MapPin, MessageSquare, Plus, Share2, X } from "lucide-react";
import { Avatar, ScreenHeader, cn } from "@/components/ui";
import { getMatch } from "@/lib/mock-data";
import { SPORT_LABELS } from "@/lib/types";

/*
 * Render stratejisi: SSR (her istekte sunucuda üretilir).
 * Paylaşılan maç linklerinin her zaman güncel kontenjanı göstermesi gerekir.
 */
export const dynamic = "force-dynamic";

export default async function MatchDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ katildi?: string }>;
}) {
  const { id } = await params;
  const { katildi } = await searchParams;
  const match = getMatch(id);
  if (!match) notFound();

  const joined = katildi === "1";
  const openSlots = match.capacity - match.joined - (joined ? 1 : 0);

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
          {/* Harita yer tutucusu; ileride Leaflet ile gerçek harita gelecek */}
          <Link
            href="/kesfet"
            className="relative flex h-40 items-center justify-center overflow-hidden rounded-2xl border border-line bg-surface-2"
          >
            <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 50" aria-hidden>
              <path d="M0 38 Q 40 30 100 12" stroke="var(--surface)" strokeWidth="5" fill="none" />
            </svg>
            <MapPin size={34} className="relative fill-danger text-danger [&>circle]:fill-white" />
          </Link>

          <p className="mt-5 text-sm font-semibold text-success">
            {SPORT_LABELS[match.sport]} • {match.format}
          </p>
          <h1 className="text-2xl font-bold">{match.title}</h1>

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
                Lvl. {match.organizer.level} Oyun Kurucu • {match.organizer.rating} Yıldız
              </p>
            </div>
            <Link
              href={`/sohbetler/${match.id}`}
              aria-label="Organizatöre yaz"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white"
            >
              <MessageSquare size={15} />
            </Link>
          </div>

          <h2 className="mt-6 mb-2 font-bold">
            Katılımcılar ({match.joined + (joined ? 1 : 0)}/{match.capacity})
          </h2>
          <div className="flex items-center">
            {match.participants.slice(0, 4).map((p, i) => (
              <span key={p.id} className={cn("h-10 w-10 rounded-full border-2 border-bg", p.color, i > 0 && "-ml-2")} />
            ))}
            {match.participants.length > 4 && (
              <span className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full border-2 border-bg bg-surface-2 text-xs font-semibold">
                +{match.participants.length - 4}
              </span>
            )}
            {Array.from({ length: Math.max(0, openSlots) }).map((_, i) => (
              <Link
                key={i}
                href={`/mac/${match.id}/dizilim`}
                aria-label="Boş yere katıl"
                className="ml-3 flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-danger text-danger"
              >
                <Plus size={16} />
              </Link>
            ))}
          </div>

          <h2 className="mt-6 mb-2 font-bold">Maç Notu</h2>
          <p className="rounded-xl border border-line bg-surface p-3 text-sm text-muted italic">“{match.note}”</p>
        </div>
      </main>

      <div className="fixed bottom-0 left-1/2 w-full max-w-[430px] -translate-x-1/2 border-t border-line bg-bg/95 px-5 pt-3 pb-6 backdrop-blur">
        {joined ? (
          <>
            <p className="mb-2 flex items-center justify-center gap-1 text-xs font-semibold text-success">
              <CircleCheck size={14} /> Kadrodasın!
            </p>
            <div className="flex gap-3">
              <Link
                href={`/sohbetler/${match.id}`}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-semibold text-white"
              >
                <MessageSquare size={18} /> Takım Sohbeti
              </Link>
              <Link
                href={`/mac/${match.id}`}
                className="flex w-16 flex-col items-center justify-center rounded-xl border border-danger/40 bg-danger/10 text-[10px] font-semibold text-danger"
              >
                <X size={18} /> Ayrıl
              </Link>
            </div>
          </>
        ) : (
          <Link
            href={`/mac/${match.id}/dizilim`}
            className="block rounded-xl bg-primary py-3.5 text-center font-semibold text-white shadow-lg shadow-primary/30"
          >
            Maça Katıl
          </Link>
        )}
      </div>
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

