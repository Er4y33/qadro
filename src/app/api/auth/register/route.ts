import { NextResponse } from "next/server";
import { registerPlayer, startSession, validateRegistration } from "@/lib/auth";

/**
 * POST /api/auth/register  { name, email, password }
 * 201 Created + oturum çerezi · 400 form hatalı · 409 Conflict: e-posta zaten kayıtlı
 */
export async function POST(request: Request) {
  const result = validateRegistration(await request.json().catch(() => null));
  if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 400 });

  const id = await registerPlayer(result.name, result.email, result.password);
  if (!id) return NextResponse.json({ errors: ["Bu e-posta ile zaten bir hesap var."] }, { status: 409 });

  await startSession(id);
  return NextResponse.json({ id }, { status: 201 });
}
