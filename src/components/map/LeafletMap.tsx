"use client";

/**
 * Leaflet harita bileşeni (OpenStreetMap, ücretsiz).
 * Leaflet tarayıcıdaki `window` nesnesine ihtiyaç duyduğu için bu dosya
 * doğrudan değil, `QadroMap` üzerinden yalnızca istemcide yüklenir.
 */
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  /** Pin üzerinde görünen kısa etiket, örn. "7v7" */
  label?: string;
  title?: string;
  subtitle?: string;
  href?: string;
}

// Harici resim dosyası gerektirmeyen, Figma'daki kırmızı damla biçiminde pin
function pinIcon(label?: string) {
  return L.divIcon({
    className: "",
    iconSize: [44, 54],
    iconAnchor: [22, 52],
    popupAnchor: [0, -46],
    html: `
      <div style="position:relative;width:44px;height:54px;filter:drop-shadow(0 6px 10px rgba(0,0,0,.35))">
        <svg viewBox="0 0 44 54" width="44" height="54">
          <path d="M22 2C11 2 3 10.4 3 21c0 13.6 19 31 19 31s19-17.4 19-31C41 10.4 33 2 22 2z" fill="#ef4444"/>
          <circle cx="22" cy="21" r="${label ? 12 : 7}" fill="#fff"/>
        </svg>
        ${label ? `<span style="position:absolute;top:14px;left:0;width:44px;text-align:center;font:700 10px/14px Inter,system-ui,sans-serif;color:#ef4444">${label}</span>` : ""}
      </div>`,
  });
}

export default function LeafletMap({
  pins,
  center,
  zoom = 14,
  interactive = true,
}: {
  pins: MapPin[];
  center: [number, number];
  zoom?: number;
  interactive?: boolean;
}) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      zoomControl={false}
      attributionControl
      dragging={interactive}
      scrollWheelZoom={interactive}
      doubleClickZoom={interactive}
      touchZoom={interactive}
      className="qadro-map h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pins.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={pinIcon(p.label)}>
          {p.title && (
            <Popup>
              <strong>{p.title}</strong>
              {p.subtitle && <div>{p.subtitle}</div>}
              {p.href && <Link href={p.href}>Detaya git →</Link>}
            </Popup>
          )}
        </Marker>
      ))}
    </MapContainer>
  );
}
