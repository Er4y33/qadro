import { NextResponse } from "next/server";
import { startSession } from "@/lib/auth";
import { logEvent } from "@/lib/matches";

/**
 * POST /api/auth/demo → Figma tasarımındaki örnek oyuncu "Atahan" olarak giriş yapar.
 * Hocanın ve ekip arkadaşlarının kayıt olmadan uygulamayı denemesi için.
 */
const DEMO_PLAYER_ID = "atahan";

export async function POST() {
  await startSession(DEMO_PLAYER_ID);
  await logEvent(DEMO_PLAYER_ID, "user_logged_in", undefined, { demo: true });
  return NextResponse.json({ id: DEMO_PLAYER_ID });
}
