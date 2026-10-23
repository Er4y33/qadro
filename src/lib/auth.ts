import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { getDb } from "./db";
import { logEvent } from "./matches";

/*
 * Kimlik doğrulama (kayıt, giriş, oturum).
 *
 * Nasıl çalışır?
 * 1. Şifre asla düz metin saklanmaz: scrypt ile tuzlanıp (salt) özetlenir (hash).
 * 2. Girişte rastgele bir oturum anahtarı üretilir ve tarayıcıya HttpOnly çerez olarak gönderilir
 *    (HTTP yanıtındaki "Set-Cookie" başlığı). JavaScript bu çereze erişemez.
 * 3. Tarayıcı sonraki her istekte çerezi "Cookie" başlığında geri yollar; sunucu kimin olduğunu buradan anlar.
 * 4. Çerez yoksa ya da geçersizse korunan API'ler 401 Unauthorized döner.
 */

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

export const SESSION_COOKIE = "qadro_session";
const SESSION_DAYS = 30;

/* ───────────── Şifre ───────────── */

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, saltHex, hashHex] = stored.split("$");
  if (algo !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected); // Sabit sürede karşılaştırma: zamanlama saldırısını önler
}

/* ───────────── Oturum ───────────── */

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

/** Oturum açar ve çerezi yazar. Yalnızca API rotalarında (Route Handler) çağrılabilir. */
export async function startSession(playerId: string) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  const db = await getDb();
  // Bakım: süresi dolmuş oturumlar ve bir günden eski giriş denemeleri her yeni oturumda temizlenir.
  await db.query("DELETE FROM sessions WHERE expires_at < now()");
  await db.query("DELETE FROM login_attempts WHERE created_at < now() - interval '1 day'");
  await db.query("INSERT INTO sessions (token_hash, player_id, expires_at) VALUES ($1, $2, $3)", [sha256(token), playerId, expires.toISOString()]);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.query("DELETE FROM sessions WHERE token_hash = $1", [sha256(token)]);
  }
  jar.delete(SESSION_COOKIE);
}

export interface Viewer {
  id: string;
  name: string;
  initials: string;
  color: string;
  level: number;
  rating: number;
  email: string | null;
}

/**
 * İsteği yapan oyuncuyu çerezden bulur; giriş yapılmamışsa null.
 * React `cache` sayesinde aynı istek içinde kaç kez çağrılırsa çağrılsın veritabanına bir kez gidilir.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = await getDb();
  const [row] = await db.query<Viewer>(
    `SELECT p.id, p.name, p.initials, p.color, p.level, p.rating, p.email
     FROM sessions s JOIN players p ON p.id = s.player_id
     WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [sha256(token)],
  );
  return row ?? null;
});

/* ───────────── Kayıt ve giriş ───────────── */

const COLORS = ["bg-primary", "bg-info", "bg-warning", "bg-violet"];

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2);
  return letters.toLocaleUpperCase("tr-TR");
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export function validateRegistration(body: unknown): { ok: true; name: string; email: string; password: string } | { ok: false; errors: string[] } {
  const b = (body ?? {}) as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name.trim().replace(/\s+/g, " ") : "";
  const email = typeof b.email === "string" ? normalizeEmail(b.email) : "";
  const password = typeof b.password === "string" ? b.password : "";
  const errors: string[] = [];
  if (name.length < 2 || name.length > 40) errors.push("Ad Soyad 2–40 karakter olmalı.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) errors.push("Geçerli bir e-posta adresi gir.");
  if (password.length < 8 || password.length > 72) errors.push("Şifre en az 8 karakter olmalı.");
  return errors.length ? { ok: false, errors } : { ok: true, name, email, password };
}

/** Yeni oyuncu oluşturur. E-posta kullanılıyorsa null döner (API 409 Conflict verir). */
export async function registerPlayer(name: string, email: string, password: string): Promise<string | null> {
  const db = await getDb();
  const taken = await db.query("SELECT 1 FROM players WHERE email = $1", [email]);
  if (taken.length > 0) return null;
  const id = `u-${randomBytes(5).toString("hex")}`;
  const color = COLORS[randomBytes(1)[0] % COLORS.length];
  await db.query(
    `INSERT INTO players (id, name, initials, color, level, rating, overall, email, password_hash)
     VALUES ($1, $2, $3, $4, 1, 4, 70, $5, $6)`,
    [id, name, initialsOf(name), color, email, await hashPassword(password)],
  );
  await logEvent(id, "user_registered");
  return id;
}

/** E-posta ve şifre doğruysa oyuncu kimliğini döner, değilse null (API 401 verir). */
/* ───────────── Giriş denemesi sınırı (rate limit) ───────────── */

/** 15 dakikada aynı e-postaya en fazla 5, aynı IP adresinden en fazla 20 hatalı deneme */
export const LOGIN_WINDOW_MINUTES = 15;
export const MAX_FAILS_PER_EMAIL = 5;
export const MAX_FAILS_PER_IP = 20;

/** Sınır aşıldıysa true: API 429 Too Many Requests döner, şifre hiç kontrol edilmez. */
export async function loginBlocked(email: string, ip: string): Promise<boolean> {
  const db = await getDb();
  const [row] = await db.query<{ by_email: number; by_ip: number }>(
    `SELECT count(*) FILTER (WHERE email = $1)::int AS by_email,
            count(*) FILTER (WHERE ip = $2 AND $2 <> '')::int AS by_ip
     FROM login_attempts WHERE created_at > now() - make_interval(mins => $3)`,
    [normalizeEmail(email), ip, LOGIN_WINDOW_MINUTES],
  );
  return row.by_email >= MAX_FAILS_PER_EMAIL || row.by_ip >= MAX_FAILS_PER_IP;
}

export async function recordFailedLogin(email: string, ip: string) {
  const db = await getDb();
  await db.query("INSERT INTO login_attempts (email, ip) VALUES ($1, $2)", [normalizeEmail(email), ip]);
}

/** Başarılı girişte o e-postanın hatalı deneme sayacı sıfırlanır */
export async function clearFailedLogins(email: string) {
  const db = await getDb();
  await db.query("DELETE FROM login_attempts WHERE email = $1", [normalizeEmail(email)]);
}

export async function authenticate(email: string, password: string): Promise<string | null> {
  const db = await getDb();
  const [row] = await db.query<{ id: string; password_hash: string | null }>("SELECT id, password_hash FROM players WHERE email = $1", [
    normalizeEmail(email),
  ]);
  // Kullanıcı olmasa bile hash hesaplanır; böylece yanıt süresinden "bu e-posta kayıtlı mı" anlaşılamaz.
  const ok = await verifyPassword(password, row?.password_hash ?? `scrypt$${"0".repeat(32)}$${"0".repeat(128)}`);
  return ok && row ? row.id : null;
}

/* ───────────── Hesap ayarları ───────────── */

export type AccountResult = { ok: true } | { ok: false; status: 400 | 401 | 403; error: string };

/** Demo hesabının (e-postasız örnek oyuncu) adı, şifresi ve varlığı herkes için ortak; değiştirilemez. */
const isDemo = (viewer: Viewer) => !viewer.email;

export async function updateName(viewer: Viewer, raw: unknown): Promise<AccountResult> {
  if (isDemo(viewer)) return { ok: false, status: 403, error: "Demo hesabının adı değiştirilemez. Kendi hesabını aç." };
  const name = typeof raw === "string" ? raw.trim().replace(/\s+/g, " ") : "";
  if (name.length < 2 || name.length > 40) return { ok: false, status: 400, error: "Ad Soyad 2–40 karakter olmalı." };
  const db = await getDb();
  await db.query("UPDATE players SET name = $2, initials = $3 WHERE id = $1", [viewer.id, name, initialsOf(name)]);
  return { ok: true };
}

/**
 * Şifre değişikliği: mevcut şifre doğrulanır, yeni şifre özetlenir ve DİĞER cihazlardaki oturumlar kapatılır
 * (şifre çalındıysa saldırganın açık oturumu da düşer). Bu cihazdaki oturum devam eder.
 */
export async function changePassword(viewer: Viewer, current: unknown, next: unknown, keepToken = ""): Promise<AccountResult> {
  if (isDemo(viewer)) return { ok: false, status: 403, error: "Demo hesabının şifresi yoktur." };
  if (typeof next !== "string" || next.length < 8 || next.length > 72) return { ok: false, status: 400, error: "Yeni şifre en az 8 karakter olmalı." };
  const db = await getDb();
  const [row] = await db.query<{ password_hash: string }>("SELECT password_hash FROM players WHERE id = $1", [viewer.id]);
  if (typeof current !== "string" || !(await verifyPassword(current, row.password_hash))) {
    return { ok: false, status: 401, error: "Mevcut şifre hatalı." };
  }
  await db.query("UPDATE players SET password_hash = $2 WHERE id = $1", [viewer.id, await hashPassword(next)]);
  await db.query("DELETE FROM sessions WHERE player_id = $1 AND token_hash <> $2", [viewer.id, sha256(keepToken)]);
  return { ok: true };
}

/**
 * Hesabı silme (KVKK: unutulma hakkı). Oyuncunun geçmiş maçlardaki kaydı takım arkadaşlarının istatistiklerini
 * bozmasın diye satır silinmez, ANONİMLEŞTİRİLİR: ad "Silinmiş Oyuncu" olur, e-posta ve şifre özeti silinir,
 * tüm oturumlar kapatılır, gelecekteki maçlardan çıkarılır ve organize ettiği gelecek maçlar iptal edilir.
 * Bu hesapla bir daha giriş yapılamaz.
 */
export async function deleteAccount(viewer: Viewer, password: unknown): Promise<AccountResult> {
  if (isDemo(viewer)) return { ok: false, status: 403, error: "Demo hesabı silinemez." };
  const db = await getDb();
  const [row] = await db.query<{ password_hash: string }>("SELECT password_hash FROM players WHERE id = $1", [viewer.id]);
  if (typeof password !== "string" || !(await verifyPassword(password, row.password_hash))) {
    return { ok: false, status: 401, error: "Şifre hatalı." };
  }
  await db.transaction(async (tx) => {
    await tx.query("DELETE FROM matches WHERE organizer_id = $1 AND starts_at > now()", [viewer.id]);
    await tx.query(
      `DELETE FROM match_participants mp USING matches m
       WHERE mp.match_id = m.id AND mp.player_id = $1 AND m.starts_at > now()`,
      [viewer.id],
    );
    await tx.query("UPDATE players SET name = 'Silinmiş Oyuncu', initials = '–', color = 'bg-slate-500', email = NULL, password_hash = NULL WHERE id = $1", [
      viewer.id,
    ]);
    await tx.query("DELETE FROM sessions WHERE player_id = $1", [viewer.id]);
  });
  return { ok: true }; // çerezi API rotası siler
}
