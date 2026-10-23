import { LeaderboardView } from "@/components/LeaderboardView";
import { SeasonStandings } from "@/components/SeasonStandings";
import { getCityLeaderboard } from "@/lib/leaderboard-data";

/*
 * Render stratejisi: ISR.
 * Sıralama çok okunur ama saniyelik güncellik gerekmez; sayfa 5 dakikada bir arka planda yeniden üretilir.
 * Veritabanı sorgusu her ziyarette değil, en fazla 5 dakikada bir çalışır. Kişiye özel kısımlar
 * ("Sen" satırı, sezon tablosu) tarayıcıda API'den okunur, böylece önbellekteki sayfa herkese aynıdır.
 */
export const revalidate = 300;

export default async function LeaderboardPage() {
  // Veritabanına o an ulaşılamazsa (ör. build sırasında) sayfa boş sıralamayla üretilir; ISR 5 dakika içinde yeniden dener.
  const entries = await getCityLeaderboard().catch((err) => {
    console.error("Sıralama verisi okunamadı:", err);
    return [];
  });
  return (
    <div className="lg:mx-auto lg:max-w-2xl lg:pt-4">
      <LeaderboardView entries={entries} />
      <SeasonStandings />
    </div>
  );
}
