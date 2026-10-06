import { LeaderboardView } from "@/components/LeaderboardView";
import { currentUser } from "@/lib/mock-data";

/*
 * Render stratejisi: ISR.
 * Sıralama çok okunur ama saniyelik güncellik gerekmez; sayfa 5 dakikada bir arka planda yenilenir.
 * Veritabanı bağlandığında bu sayfa her istekte sorgu atmak yerine önbellekten sunulur.
 */
export const revalidate = 300;

export default function LeaderboardPage() {
  return <LeaderboardView playerId={currentUser.id} />;
}
