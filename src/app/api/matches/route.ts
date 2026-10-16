import { NextResponse } from "next/server";
import { createMatch, listMatches, validateCreateMatch } from "@/lib/matches";
import { CURRENT_PLAYER_ID } from "@/lib/session";

/** GET /api/matches → 200 + maç listesi */
export async function GET() {
  const matches = await listMatches(CURRENT_PLAYER_ID);
  return NextResponse.json(matches);
}

/**
 * POST /api/matches → yeni maç
 * 201 Created: oluşturuldu (Location başlığı yeni maçın adresini gösterir)
 * 400 Bad Request: gövde geçersiz
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const result = validateCreateMatch(body);
  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }
  const id = await createMatch(result.value, CURRENT_PLAYER_ID);
  return NextResponse.json({ id }, { status: 201, headers: { Location: `/api/matches/${id}` } });
}
