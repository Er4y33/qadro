import { NextResponse } from "next/server";
import { getMatch } from "@/lib/matches";

/** GET /api/matches/:id → 200 + maç ya da 404 Not Found */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await getMatch(id);
  if (!match) return NextResponse.json({ error: "Maç bulunamadı." }, { status: 404 });
  return NextResponse.json(match);
}
