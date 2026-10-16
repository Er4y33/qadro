import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth";
import { unauthorized } from "@/lib/session";

/** GET /api/auth/me → 200 + giriş yapan oyuncu · 401 giriş yapılmamış */
export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  return NextResponse.json(viewer);
}
