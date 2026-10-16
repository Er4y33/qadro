import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppFrame } from "@/components/AppFrame";

export const metadata: Metadata = {
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
