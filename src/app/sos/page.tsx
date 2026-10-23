import { notFound } from "next/navigation";
import { SosCall } from "@/components/SosCall";
import { getMatch, listMatches } from "@/lib/matches";
import { requireViewer } from "@/lib/session";
import { countSosRecipients } from "@/lib/sos";

/** SSR: kadro ve çağrıyı görecek oyuncu sayısı her açılışta güncel okunur */
export const dynamic = "force-dynamic";

export default async function SosPage({ searchParams }: { searchParams: Promise<{ mac?: string }> }) {
  const { mac } = await searchParams;
  const match = mac ? await getMatch(mac) : (await listMatches((await requireViewer()).id))[0];
  if (!match) notFound();

  const eligible = await countSosRecipients(match.id);
  return <SosCall matchId={match.id} matchTitle={match.title} sport={match.sport} eligible={eligible} />;
}
