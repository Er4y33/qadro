import "server-only";
import { SCHEMA_SQL } from "./schema";
import { seed } from "./seed";

/**
 * Veritabanı bağlantısı.
 *
 * - DATABASE_URL (ya da Vercel–Supabase entegrasyonunun eklediği POSTGRES_URL) varsa: gerçek PostgreSQL (Supabase).
 * - Yoksa: PGlite. Bilgisayara kurulum gerektirmeyen, WebAssembly ile çalışan gömülü PostgreSQL.
 *   Veriler proje klasöründeki `.qadro-db/` içinde saklanır (Git'e gönderilmez).
 *
 * Her iki durumda da aynı SQL çalışır; uygulama kodu farkı bilmez.
 */
export type Row = Record<string, unknown>;

interface Db {
  query<T = Row>(text: string, params?: unknown[]): Promise<T[]>;
  exec(text: string): Promise<void>;
  kind: "postgres" | "pglite";
}

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

async function createDb(): Promise<Db> {
  if (connectionString) {
    const { default: postgres } = await import("postgres");
    const url = new URL(connectionString);
    const local = ["localhost", "127.0.0.1"].includes(url.hostname);
    // Bağlantı adresindeki ek parametreler (sslmode, supa, pgbouncer…) postgres.js'te hata verebildiği için temizlenir.
    url.search = "";
    const sql = postgres(url.toString(), {
      ssl: local ? false : "require",
      prepare: false, // Supabase'in "transaction pooler" bağlantısı hazır sorguları desteklemez
      max: 1, // Sunucusuz (serverless) ortamda her örnek tek bağlantı kullanır
      onnotice: () => {},
    });
    return {
      kind: "postgres",
      query: async <T,>(text: string, params: unknown[] = []) =>
        (await sql.unsafe(text, params as never[])) as unknown as T[],
      exec: async (text) => {
        await sql.unsafe(text);
      },
    };
  }

  const { PGlite } = await import("@electric-sql/pglite");
  // Vercel'de dosya sistemi salt okunur: veritabanı bağlanmamışsa geçici bellekte çalışır.
  const pg = process.env.VERCEL ? new PGlite() : new PGlite(process.env.PGLITE_DIR || "./.qadro-db");
  return {
    kind: "pglite",
    query: async <T,>(text: string, params: unknown[] = []) => (await pg.query<T>(text, params)).rows,
    exec: async (text) => {
      await pg.exec(text);
    },
  };
}

// Geliştirme sunucusu dosyaları yeniden yüklediğinde ikinci bir bağlantı açılmasın diye global'de tutulur.
const globalForDb = globalThis as unknown as { qadroDb?: Promise<Db> };

async function init(): Promise<Db> {
  const db = await createDb();
  await db.exec(SCHEMA_SQL); // Tablolar yoksa oluşturur (IF NOT EXISTS)
  await seed(db); // Tablolar boşsa örnek verileri ekler
  return db;
}

export function getDb(): Promise<Db> {
  globalForDb.qadroDb ??= init().catch((err) => {
    globalForDb.qadroDb = undefined; // Hata olursa bir sonraki istekte tekrar dene
    throw err;
  });
  return globalForDb.qadroDb;
}

export type { Db };
