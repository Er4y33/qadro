import { NextResponse } from "next/server";
import { startSession } from "@/lib/auth";
import { DEMO_PLAYER_ID, resetDemo } from "@/lib/demo";
import { logEvent } from "@/lib/matches";

/**
 * POST /api/demo/start → rehberli demo turunu başlatır.
 * Demo maçlarını şimdiki zamana göre yeniden kurar (yalnızca "demo-" ile başlayan maçlar) ve
 * demo oyuncusu (Atahan) olarak oturum açar. Hocanın kayıt olmadan tüm akışı denemesi için.
 */
export async function POST() {
  await resetDemo();
  await startSession(DEMO_PLAYER_ID);
  await logEvent(DEMO_PLAYER_ID, "demo_started");
  return NextResponse.json({ id: DEMO_PLAYER_ID }, { status: 201 });
}
