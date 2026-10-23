import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Test ayarları.
 * - "@/..." kısayolu tsconfig'deki gibi src klasörünü gösterir.
 * - "server-only" paketi yalnızca Next.js sunucusunda anlamlıdır; testlerde boş bir modülle değiştirilir.
 * - Veritabanı testleri bellekte çalışan PGlite kullanır (tests/setup.ts); diske ya da Supabase'e dokunmaz.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./tests/server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    testTimeout: 20_000,
  },
});
