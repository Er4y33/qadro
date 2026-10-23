import "server-only";
import { createHash } from "node:crypto";
import { SCHEMA_SQL } from "./schema";
import { seed } from "./seed";

/**
 * Veritabanı bağlantısı.
 *
 * - Bağlantı adresi tanımlıysa (aşağıya bakın): gerçek PostgreSQL (Supabase).
 * - Yoksa: PGlite. Bilgisayara kurulum gerektirmeyen, WebAssembly ile çalışan gömülü PostgreSQL.
 *   Veriler proje klasöründeki `.qadro-db/` içinde saklanır (Git'e gönderilmez).
 *
 * Her iki durumda da aynı SQL çalışır; uygulama kodu farkı bilmez.
 */
export type Row = Record<string, unknown>;

/** İşlem (transaction) içinde kullanılan bağlantı: yalnızca sorgu çalıştırır */
interface Tx {
  query<T = Row>(text: string, params?: unknown[]): Promise<T[]>;
}

interface Db extends Tx {
  exec(text: string): Promise<void>;
  /**
   * Verilen fonksiyonu tek bir işlem (BEGIN … COMMIT) içinde çalıştırır.
   * Fonksiyon hata fırlatırsa her şey geri alınır (ROLLBACK): ya hepsi kaydedilir ya hiçbiri.
   */
  transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T>;
  kind: "postgres" | "pglite";
}

/**
 * Bağlantı adresi şu sırayla aranır:
 * DATABASE_URL → POSTGRES_URL → önekli Vercel–Supabase değişkeni (ör. STORAGE_POSTGRES_URL).
 * Vercel entegrasyonu değişkenlere bir önek ekleyebildiği için sonuncusu otomatik bulunur.
 */
const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  Object.entries(process.env).find(([key, value]) => key.endsWith("_POSTGRES_URL") && value)?.[1];

/** Bir sorgu bu süreden uzun sürerse bağlantı ölü sayılır (ms) */
const QUERY_TIMEOUT_MS = 12_000;

/**
 * Sözü (promise) süre sınırıyla bekler. Süre dolarsa onTimeout çağrılır ve hata fırlatılır.
 * Neden gerekli? Vercel, istek bitince fonksiyonu dondurur. Donmuşken Supabase'in havuzu bağlantıyı kapatabilir;
 * fonksiyon uyandığında eski soket "yarı ölü" kalır ve üzerinden gönderilen sorgu hiç cevap almaz.
 * Sınır olmasaydı sayfa "Sahaya iniliyor…" ekranında sonsuza kadar beklerdi.
 */
async function withTimeout<T>(promise: Promise<T>, onTimeout: () => void, ms = QUERY_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      onTimeout();
      reject(new Error(`Veritabanı ${ms / 1000} saniye içinde yanıt vermedi; bağlantı yenilenecek.`));
    }, ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

async function createDb(): Promise<Db> {
  if (connectionString) {
    const { default: postgres } = await import("postgres");
    const url = new URL(connectionString);
    const local = ["localhost", "127.0.0.1"].includes(url.hostname);
    // Supabase havuzunun "transaction" modu (6543) yerine "session" modu (5432) kullanılır.
    // 23 Ekim'de transaction modunda aynı anda giden sorgular "CONNECTION_DESTROYED" ile koptu;
    // session modunda her bağlantı kendi sunucu oturumunu tutar, aynı anda giden sorgularla sorun yaşamaz.
    // Fonksiyon başına tek bağlantı (max: 1) ve 10 sn boşta kapanma ile bağlantı sayısı küçük kalır.
    if (url.hostname.endsWith("pooler.supabase.com") && url.port === "6543" && !process.env.DATABASE_URL) url.port = "5432";
    // Bağlantı adresindeki ek parametreler (sslmode, supa, pgbouncer…) postgres.js'te hata verebildiği için temizlenir.
    url.search = "";
    const sql = postgres(url.toString(), {
      ssl: local ? false : "require",
      prepare: false, // Havuz modu değişirse de güvenli kalsın diye hazır (prepared) sorgu kullanılmaz
      max: 1, // Sunucusuz (serverless) ortamda her örnek tek bağlantı kullanır
      // Sunucusuz ortam için: 10 sn boşta kalan bağlantı kapanır, en fazla 5 dk yaşar.
      // Böylece fonksiyon uykudan uyandığında eski (ölmüş olabilecek) bir soket yerine yeni bağlantı açılır.
      idle_timeout: 10,
      max_lifetime: 60 * 5,
      connect_timeout: 10,
      onnotice: () => {},
    });
    // Süre dolarsa bağlantı atılır ve bir sonraki istek sıfırdan bağlanır
    const reset = () => {
      globalForDb.qadroDb = undefined;
      sql.end({ timeout: 0 }).catch(() => {});
    };
    return {
      kind: "postgres",
      query: async <T,>(text: string, params: unknown[] = []) =>
        (await withTimeout(sql.unsafe(text, params as never[]), reset)) as unknown as T[],
      exec: async (text) => {
        await withTimeout(sql.unsafe(text), reset);
      },
      transaction: async (fn) =>
        (await withTimeout(sql.begin(async (tx) => {
          // Emniyet kemeri: bir kilit 5 saniyede alınamazsa ya da işlem yarıda kalıp boşta beklerse
          // (ör. sunucusuz fonksiyon dondurulduysa) PostgreSQL işlemi iptal eder; kilitler sonsuza kadar tutulmaz.
          await tx.unsafe("SET LOCAL lock_timeout = '5s'");
          await tx.unsafe("SET LOCAL idle_in_transaction_session_timeout = '15s'");
          return fn({ query: async <T,>(text: string, params: unknown[] = []) => (await tx.unsafe(text, params as never[])) as unknown as T[] });
        }), reset)) as Awaited<ReturnType<typeof fn>>,
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
    transaction: (fn) => pg.transaction((tx) => fn({ query: async <T,>(text: string, params: unknown[] = []) => (await tx.query<T>(text, params)).rows })),
  };
}

// Geliştirme sunucusu dosyaları yeniden yüklediğinde ikinci bir bağlantı açılmasın diye global'de tutulur.
const globalForDb = globalThis as unknown as { qadroDb?: Promise<Db> };

/**
 * Şema yalnızca DEĞİŞTİYSE uygulanır. SQL metninin özeti schema_meta tablosunda saklanır; aynıysa atlanır.
 * Neden? "ALTER TABLE … ADD COLUMN IF NOT EXISTS" sütun zaten varsa bile tabloyu kısa süre kilitler.
 * Vercel'de her soğuk başlangıçta bunu çalıştırmak hem yavaşlatır hem de başka bir bağlantının kilidini beklerken
 * sayfanın takılmasına yol açabilir. Uygulanırken de 10 saniyelik kilit sınırı vardır: beklemek yerine hata verir,
 * bir sonraki istek yeniden dener.
 */
async function applySchema(db: Db) {
  const version = createHash("sha256").update(SCHEMA_SQL).digest("hex").slice(0, 16);
  await db.exec("CREATE TABLE IF NOT EXISTS schema_meta (key text PRIMARY KEY, value text NOT NULL)");
  const [row] = await db.query<{ value: string }>("SELECT value FROM schema_meta WHERE key = 'schema'");
  if (row?.value === version) return;
  if (db.kind === "postgres") {
    await db.transaction(async (tx) => {
      await tx.query("SET LOCAL lock_timeout = '10s'");
      await tx.query(SCHEMA_SQL);
    });
  } else {
    await db.exec(SCHEMA_SQL);
  }
  await db.query(
    `INSERT INTO schema_meta (key, value) VALUES ('schema', $1)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [version],
  );
}

async function init(): Promise<Db> {
  const db = await createDb();
  await applySchema(db); // Tablolar yoksa ya da şema değiştiyse oluşturur / günceller
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

export type { Db, Tx };
