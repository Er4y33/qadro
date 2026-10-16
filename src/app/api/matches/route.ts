import { NextResponse } from "next/server";
import { createMatch, listMatches, validateCreateMatch } from "@/lib/matches";
import { getViewer } from "@/lib/auth";
import { unauthorized } from "@/lib/session";

/** GET /api/matches → 200 + maç listesi · 401 giriş yapılmamış */
export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  const matches = await listMatches(viewer.id);
  return NextResponse.json(matches);
}

/**
 * POST /api/matches → yeni maç
 * 201 Created: oluşturuldu (Location başlığı yeni maçın adresini gösterir)
 * 400 Bad Request: gövde geçersiz
 * 401 Unauthorized: giriş yapılmamış
 */
export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  const body = await request.json().catch(() => null);
  const result = validateCreateMatch(body);
  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }
  const id = await createMatch(result.value, viewer.id);
  return NextResponse.json({ id }, { status: 201, headers: { Location: `/api/matches/${id}` } });
}
