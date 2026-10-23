/**
 * Saha (tesis) kataloğu. Uygulamada kodda tutulan TEK veri budur; geri kalan her şey veritabanındadır.
 * Neden kodda? Sahalar nadiren değişen referans veridir ve /saha/[id] sayfaları build anında (SSG) üretilir.
 * Adresler ve koordinatlar temsilidir; mekân adları Figma tasarımındaki örneklerle aynıdır.
 */
import type { Venue } from "./types";

/** Örnek tesisler. Adresler ve koordinatlar temsilidir. */
export const venues: Venue[] = [
  {
    id: "elbistan-sentetik",
    name: "Elbistan Sentetik Saha",
    shortName: "Sentetik Saha",
    address: "Orhangazi Mah. Spor Cad. No: 12",
    lat: 38.2052,
    lng: 37.1975,
    distanceKm: 2.4,
    driveMinutes: 8,
    amenities: ["Ücretsiz Otopark", "Sıcak Duş", "Kiralık Ayakkabı"],
    sports: ["futbol"],
  },
  {
    id: "kmaras-merkez",
    name: "Kahramanmaraş Merkez Saha",
    shortName: "Merkez Saha",
    address: "Dulkadiroğlu, Kahramanmaraş",
    lat: 37.5858,
    lng: 36.9371,
    distanceKm: 6.1,
    driveMinutes: 14,
    amenities: ["Otopark", "Soyunma Odası"],
    sports: ["futbol"],
  },
  {
    id: "elbistan-salon",
    name: "Elbistan Spor Salonu",
    shortName: "Spor Salonu",
    address: "Elbistan, Kahramanmaraş",
    lat: 38.2008,
    lng: 37.1886,
    distanceKm: 3.2,
    driveMinutes: 10,
    amenities: ["Kapalı Alan", "Duş"],
    sports: ["basketbol", "voleybol"],
  },
  {
    id: "kmaras-kapali",
    name: "Merkez Kapalı Salon",
    shortName: "Kapalı Salon",
    address: "Onikişubat, Kahramanmaraş",
    lat: 37.5768,
    lng: 36.9147,
    distanceKm: 7.4,
    driveMinutes: 17,
    amenities: ["Kapalı Alan", "Tribün"],
    sports: ["basketbol", "voleybol"],
  },
  {
    id: "elbistan-tenis",
    name: "Elbistan Tenis Kortları",
    shortName: "Tenis Kortları",
    address: "Elbistan Gençlik Merkezi, Kahramanmaraş",
    lat: 38.2079,
    lng: 37.1921,
    distanceKm: 1.8,
    driveMinutes: 6,
    amenities: ["Aydınlatma", "Raket Kiralama"],
    sports: ["tenis"],
  },
];

export function getVenue(id: string): Venue | undefined {
  return venues.find((v) => v.id === id);
}
