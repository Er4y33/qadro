import { NextResponse } from "next/server";
import { daysLeft } from "@/lib/gamification";
import { getSeasonStandings } from "@/lib/progress";

export const dynamic = "force-dynamic";

/**
 * GET /api/season → içinde bulunulan sezonun XP sıralaması (veritabanındaki onaylı etkinliklerden)
 * Şehrin En İyileri sayfası ISR ile önbellekten gelir; sezon tablosu bu uç noktadan canlı okunur.
 */
export async function GET() {
  const { season, entries } = await getSeasonStandings();
  return NextResponse.json({
    season: { name: season.name, daysLeft: daysLeft(season) },
    entries: entries.slice(0, 10),
  });
}
