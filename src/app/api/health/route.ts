import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/health → uygulamanın ve veritabanının durumu.
 * "database": "postgres" ise Supabase'e bağlı, "pglite" ise gömülü (geçici) veritabanı kullanılıyor.
 * 503 Service Unavailable: veritabanına ulaşılamıyor.
 *
 * Vercel her gün bu adresi bir kez çağırır (vercel.json → crons). Supabase'in ücretsiz planı 7 gün
 * kullanılmayan projeyi duraklatıyor; günlük bu küçük sorgu veritabanını uyanık tutar.
 */
export async function GET() {
  try {
    const db = await getDb();
    const [counts] = await db.query<{ matches: number; events: number }>(
      "SELECT (SELECT count(*)::int FROM matches) AS matches, (SELECT count(*)::int FROM user_events) AS events",
    );
    return NextResponse.json({ status: "ok", database: db.kind, ...counts });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ status: "error", message: "Veritabanına bağlanılamadı." }, { status: 503 });
  }
}
