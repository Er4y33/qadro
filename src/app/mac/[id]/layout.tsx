import { getDb } from "@/lib/db";
import { isSport } from "@/lib/sports";

/**
 * Maç sayfalarının ortak kapsayıcısı: maçın branşına göre vurgu rengini uygular
 * (futbol yeşil, basketbol turuncu, voleybol mor, tenis camgöbeği; globals.css → data-sport).
 * "contents" sayesinde kapsayıcı düzeni etkilemez; CSS değişkenleri yine alt öğelere geçer.
 */
export default async function MatchLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  const [row] = await db.query<{ sport: string }>("SELECT sport FROM matches WHERE id = $1", [id]);
  const sport = row && isSport(row.sport) ? row.sport : undefined;
  return (
    <div data-sport={sport} className="contents">
      {children}
    </div>
  );
}
