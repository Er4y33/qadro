import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gömülü PostgreSQL (PGlite) WebAssembly dosyası içerir; paketlenmeden Node.js tarafından yüklenmesi gerekir.
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
