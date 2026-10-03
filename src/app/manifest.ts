import type { MetadataRoute } from "next";

/**
 * PWA bildirimi: Qadro telefonda "Ana ekrana ekle" ile uygulama gibi kurulabilir.
 * Next.js bu dosyadan otomatik olarak /manifest.webmanifest üretir.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Qadro",
    short_name: "Qadro",
    description: "Eksik oyuncu derdine son. Çevrendeki maçları bul, takımını kur, sahaya in.",
    lang: "tr",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#111827",
    theme_color: "#111827",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
