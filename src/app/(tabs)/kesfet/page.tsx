import Link from "next/link";
import { MapPin } from "lucide-react";
import { QadroMap, type MapPin as Pin } from "@/components/map/QadroMap";
import { getVenue, matches } from "@/lib/mock-data";

export default function ExplorePage() {
  const items = matches.flatMap((match) => {
    const venue = getVenue(match.venueId);
    return venue ? [{ match, venue }] : [];
  });

  const pins: Pin[] = items.map(({ match, venue }) => ({
    id: match.id,
    lat: venue.lat,
    lng: venue.lng,
    label: match.format,
    title: match.title,
    subtitle: `${match.dayLabel}, ${match.time} • ${match.joined}/${match.capacity}`,
    href: `/mac/${match.id}`,
  }));

  return (
    <div className="flex h-[calc(100dvh-7rem)] flex-col">
      <header className="px-5 pt-6 pb-3">
        <h1 className="text-2xl font-bold">Keşfet</h1>
        <p className="text-sm text-muted">Çevrendeki açık maçlar</p>
      </header>

      <div className="relative mx-5 flex-1 overflow-hidden rounded-2xl border border-line">
        {/* Kahramanmaraş merkez ile Elbistan arasını gösterecek şekilde ortalanır */}
        <QadroMap center={[37.9, 37.05]} zoom={9} pins={pins} />
      </div>

      <ul className="flex gap-3 overflow-x-auto px-5 py-4">
        {items.map(({ match, venue }) => (
          <li key={match.id} className="w-60 shrink-0">
            <Link href={`/mac/${match.id}`} className="block rounded-2xl border border-line bg-surface p-3">
              <p className="truncate text-sm font-bold">
                {match.title} ({match.format})
              </p>
              <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted">
                <MapPin size={12} /> {venue.name} • {venue.distanceKm} km
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
