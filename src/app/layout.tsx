import type { Metadata, Viewport } from "next";
import "./globals.css";

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
        {/* Uygulama mobil öncelikli; masaüstünde telefon genişliğinde ortalanır */}
        <div className="qadro-stripes mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-bg shadow-2xl shadow-black/20">
          {children}
        </div>
      </body>
    </html>
  );
}
