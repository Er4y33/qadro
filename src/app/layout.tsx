import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppFrame } from "@/components/AppFrame";

/** Paylaşım görsellerinin tam adresi için: Vercel'de canlı alan adı, yerelde localhost */
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Qadro | Eksik Oyuncu Derdine Son",
  description:
    "Çevrendeki halı saha, basketbol ve voleybol maçlarını bul, takımını kur, sahaya in.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#111827",
};

// Sayfa çizilmeden önce kayıtlı temayı uygular, böylece açılışta renk sıçraması olmaz.
const themeScript = `
try {
  var t = localStorage.getItem("qadro-theme") || "dark";
  document.documentElement.dataset.theme = t;
} catch (e) {
  document.documentElement.dataset.theme = "dark";
}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {/* Mobil öncelikli, masaüstünde kenar menülü tam ekran (src/components/AppFrame.tsx) */}
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
