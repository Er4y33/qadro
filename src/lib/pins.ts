import type { MapPin } from "@/components/map/LeafletMap";
import { getVenue } from "./mock-data";
import type { Match } from "./types";

/** Maç listesinden harita iğneleri (Keşfet ve masaüstü ana sayfa ortak kullanır) */
export function matchPins(matches: Match[]): MapPin[] {
  return matches.flatMap((match) => {
    const venue = getVenue(match.venueId);
    return venue
      ? [
          {
            id: match.id,
            lat: venue.lat,
            lng: venue.lng,
            label: match.format,
            title: match.title,
            subtitle: `${match.dayLabel}, ${match.time} • ${match.joined}/${match.capacity}`,
            href: `/mac/${match.id}`,
          },
        ]
      : [];
  });
}
