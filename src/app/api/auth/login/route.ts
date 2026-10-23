import { NextResponse } from "next/server";
import { authenticate, clearFailedLogins, LOGIN_WINDOW_MINUTES, loginBlocked, recordFailedLogin, startSession } from "@/lib/auth";
import { logEvent } from "@/lib/matches";

/**
 * POST /api/auth/login  { email, password }
 * 200 OK + oturum çerezi · 401 Unauthorized: e-posta ya da şifre hatalı
 * 429 Too Many Requests: 15 dakikada çok fazla hatalı deneme (kaba kuvvet saldırısına karşı)
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: unknown; password?: unknown };
  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";
  // Vercel gerçek istemci adresini x-forwarded-for başlığının ilk değerine yazar
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";

  if (email && (await loginBlocked(email, ip))) {
    return NextResponse.json(
      { error: `Çok fazla hatalı deneme. ${LOGIN_WINDOW_MINUTES} dakika sonra tekrar dene.` },
      { status: 429, headers: { "Retry-After": String(LOGIN_WINDOW_MINUTES * 60) } },
    );
  }

  const id = email && password ? await authenticate(email, password) : null;
  // Hangisinin yanlış olduğu bilerek söylenmez: kayıtlı e-postaların tahmin edilmesini zorlaştırır.
  if (!id) {
    if (email) await recordFailedLogin(email, ip);
    return NextResponse.json({ error: "E-posta ya da şifre hatalı." }, { status: 401 });
  }

  await clearFailedLogins(email);
  await startSession(id);
  await logEvent(id, "user_logged_in");
  return NextResponse.json({ id });
}
