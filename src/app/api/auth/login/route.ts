import { NextResponse } from "next/server";
import { authenticate, startSession } from "@/lib/auth";
import { logEvent } from "@/lib/matches";

/**
 * POST /api/auth/login  { email, password }
 * 200 OK + oturum çerezi · 401 Unauthorized: e-posta ya da şifre hatalı
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: unknown; password?: unknown };
  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";

  const id = email && password ? await authenticate(email, password) : null;
  // Hangisinin yanlış olduğu bilerek söylenmez: kayıtlı e-postaların tahmin edilmesini zorlaştırır.
  if (!id) return NextResponse.json({ error: "E-posta ya da şifre hatalı." }, { status: 401 });

  await startSession(id);
  await logEvent(id, "user_logged_in");
  return NextResponse.json({ id });
}
