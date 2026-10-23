import Link from "next/link";
import { MapPin } from "lucide-react";
import { QadroMap } from "@/components/map/QadroMap";
import { getVenue } from "@/lib/venues";
import { listMatches } from "@/lib/matches";
import { matchPins } from "@/lib/pins";
import { requireViewer } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const viewer = await requireViewer();
  const matches = await listMatches(viewer.id);
  const items = matches.flatMap((match) => {
    const venue = getVenue(match.venueId);
    return venue ? [{ match, venue }] : [];
  });

  return (
    <div className="flex h-[calc(100dvh-7rem)] flex-col lg:grid lg:h-dvh lg:grid-cols-[360px_1fr] lg:grid-rows-[auto_1fr] lg:gap-x-6 lg:p-8">
      <header className="px-5 pt-6 pb-3 lg:col-span-2 lg:px-0 lg:pt-0 lg:pb-5">
        <h1 className="text-2xl font-bold lg:text-3xl">Keşfet</h1>
        <p className="text-sm text-muted">Çevrendeki açık maçlar</p>
      </header>

      <div className="relative mx-5 flex-1 overflow-hidden rounded-2xl border border-line lg:order-2 lg:mx-0">
        {/* Kahramanmaraş merkez ile Elbistan arasını gösterecek şekilde ortalanır */}
        <QadroMap center={[37.9, 37.05]} zoom={9} pins={matchPins(matches)} />
      </div>

      {/* Telefonda haritanın altında yatay kaydırılan kartlar, masaüstünde haritanın solunda dikey liste */}
      <ul className="flex gap-3 overflow-x-auto px-5 py-4 lg:order-1 lg:flex-col lg:overflow-y-auto lg:px-0 lg:py-0">
        {items.map(({ match, venue }) => (
          <li key={match.id} className="w-60 shrink-0 lg:w-full">
            <Link
              href={`/mac/${match.id}`}
              className="block rounded-2xl border border-line bg-surface p-3 transition hover:border-primary/50 lg:p-4"
            >
              <p className="truncate text-sm font-bold lg:text-base">
                {match.title} ({match.format})
              </p>
              <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted">
                <MapPin size={12} /> {venue.name} • {venue.distanceKm} km
              </p>
              <p className="mt-1 hidden text-xs font-medium lg:block">
                {match.dayLabel}, {match.time} • {match.joined}/{match.capacity} oyuncu
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
