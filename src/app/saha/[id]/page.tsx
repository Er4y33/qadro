import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Navigation, Share } from "lucide-react";
import { QadroMap } from "@/components/map/QadroMap";
import { getVenue, venues } from "@/lib/mock-data";

/*
 * Render stratejisi: SSG. Tesis bilgileri nadiren değişir,
 * bu yüzden her tesis sayfası build anında bir kez üretilir.
 */
export function generateStaticParams() {
  return venues.map((v) => ({ id: v.id }));
}

export default async function VenuePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mac?: string }>;
}) {
  const { id } = await params;
  const { mac } = await searchParams;
  const venue = getVenue(id);
  if (!venue) notFound();

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}`;
  const backHref = mac ? `/mac/${mac}` : "/kesfet";

  return (
    <main className="relative flex flex-1 flex-col">
      <div className="absolute inset-0">
        <QadroMap center={[venue.lat - 0.004, venue.lng]} zoom={15} pins={[{ id: venue.id, lat: venue.lat, lng: venue.lng }]} />
      </div>

      <header className="relative z-[500] grid grid-cols-[44px_1fr_44px] items-center px-4 pt-5">
        <Link href={backHref} aria-label="Geri" className="flex h-11 w-11 items-center justify-center rounded-full bg-surface/90 shadow">
          <ChevronLeft size={22} />
        </Link>
        <h1 className="mx-auto rounded-full bg-surface/90 px-4 py-2 text-sm font-semibold shadow">Saha Konumu</h1>
        <span />
      </header>

      <section className="relative z-[500] mt-auto rounded-t-3xl border-t border-line bg-surface px-5 pt-3 pb-8 shadow-2xl">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />
        <h2 className="text-xl font-bold">{venue.name}</h2>
        <p className="mt-1 text-sm text-muted">{venue.address}</p>

        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="rounded-md bg-success/15 px-2 py-1 font-semibold text-success">{venue.distanceKm} km</span>
          <span className="text-muted">• {venue.driveMinutes} dk sürüş mesafesinde</span>
        </div>

        <ul className="mt-4 flex flex-wrap gap-2">
          {venue.amenities.map((a) => (
            <li key={a} className="flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {a}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex gap-3">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-semibold text-white shadow-lg shadow-primary/30"
          >
            <Navigation size={18} /> Yol Tarifi Al
          </a>
          <a
            href={`https://www.openstreetmap.org/?mlat=${venue.lat}&mlon=${venue.lng}#map=17/${venue.lat}/${venue.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Haritada aç"
            className="flex w-14 items-center justify-center rounded-xl border border-line"
          >
            <Share size={18} />
          </a>
        </div>
      </section>
    </main>
  );
}
