import { ProfileView } from "@/components/ProfileView";
import { getProfile } from "@/lib/players";
import { requireViewer } from "@/lib/session";

/** SSR: profil her açılışta veritabanındaki katılım, oy ve MVP kayıtlarından hesaplanır */
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const profile = await getProfile(await requireViewer());
  return <ProfileView profile={profile} own />;
}
