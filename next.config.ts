import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gömülü PostgreSQL (PGlite) WebAssembly dosyası içerir; paketlenmeden Node.js tarafından yüklenmesi gerekir.
  serverExternalPackages: ["@electric-sql/pglite"],
  // Geliştirme modundaki "N" göstergesi masaüstünde kenar menüdeki profil kartının üstüne biniyordu
  devIndicators: { position: "bottom-right" },
  // Paylaşım görseli yazı tipini çalışma anında dosyadan okur; Vercel paketine dahil edilsin
  outputFileTracingIncludes: { "/oyuncu/[id]/opengraph-image": ["./assets/fonts/**"] },
};

export default nextConfig;
