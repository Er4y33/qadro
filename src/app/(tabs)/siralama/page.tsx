import { LeaderboardView } from "@/components/LeaderboardView";
import { SeasonStandings } from "@/components/SeasonStandings";
import { currentUser } from "@/lib/mock-data";

/*
 * Render stratejisi: ISR.
 * Sıralama çok okunur ama saniyelik güncellik gerekmez; sayfa 5 dakikada bir arka planda yenilenir.
 * Veritabanı bağlandığında bu sayfa her istekte sorgu atmak yerine önbellekten sunulur.
 */
export const revalidate = 300;

export default function LeaderboardPage() {
  return (
    <div className="lg:mx-auto lg:max-w-2xl lg:pt-4">
      <LeaderboardView playerId={currentUser.id} />
      <SeasonStandings playerId={currentUser.id} />
    </div>
  );
}
