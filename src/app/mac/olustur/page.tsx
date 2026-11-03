import type { Metadata } from "next";
import { CreateMatchWizard } from "@/components/CreateMatchWizard";
import { venues } from "@/lib/venues";
import { countOrganized } from "@/lib/players";
import { requireViewer } from "@/lib/session";
import { listTeams } from "@/lib/teams";

export const metadata: Metadata = { title: "Maç Oluştur | Qadro" };

/**
 * Sayfanın kendisi sunucu bileşenidir: saha listesini sunucuda hazırlar.
 * Etkileşimli 3 adımlı form ise istemci bileşenidir (CSR).
 */
export default async function CreateMatchPage({ searchParams }: { searchParams: Promise<{ takim?: string }> }) {
  const viewer = await requireViewer();
  const { takim } = await searchParams;
  const [organized, teams] = await Promise.all([countOrganized(viewer.id), listTeams(viewer.id)]);
  // Üyesi olunan her takım davet edilebilir (src/lib/teams.ts → inviteTeam)
  const own = teams.map((t) => ({ id: t.id, name: t.name, sport: t.sport, size: t.members.length }));
  return <CreateMatchWizard venues={venues} organizedBefore={organized} teams={own} initialTeamId={takim ?? null} />;
}
