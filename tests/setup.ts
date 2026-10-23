// Testler gerçek veritabanına asla bağlanmasın: bağlantı değişkenleri silinir, PGlite bellekte açılır.
for (const key of Object.keys(process.env)) {
  if (key === "DATABASE_URL" || key.endsWith("POSTGRES_URL")) delete process.env[key];
}
process.env.PGLITE_DIR = "memory://";
