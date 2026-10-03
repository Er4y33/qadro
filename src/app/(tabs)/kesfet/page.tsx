import { MapPinned } from "lucide-react";

export default function ExplorePage() {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-8 text-center">
      <MapPinned size={40} className="text-primary" />
      <h1 className="mt-4 text-xl font-bold">Keşfet ve Harita</h1>
      <p className="mt-2 text-sm text-muted">
        Yakındaki maçlar ve tesisler harita üzerinde burada görünecek (Leaflet + OpenStreetMap).
      </p>
    </div>
  );
}
