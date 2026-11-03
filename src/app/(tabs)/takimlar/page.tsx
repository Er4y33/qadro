import { ScreenHeader } from "@/components/ui";
import { TeamManager } from "@/components/TeamManager";
import { listTeammates } from "@/lib/chat";
import { requireViewer } from "@/lib/session";
import { listTeams } from "@/lib/teams";

/** SSR: takımlar ve "birlikte oynadığın oyuncular" listesi her açılışta veritabanından */
export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const viewer = await requireViewer();
  const [teams, teammates] = await Promise.all([listTeams(viewer.id), listTeammates(viewer.id)]);
  return (
    <div className="lg:mx-auto lg:max-w-2xl">
      <ScreenHeader title="Takımlarım" backHref="/profil" />
      <TeamManager viewerId={viewer.id} teams={teams} teammates={teammates} />
    </div>
  );
}
