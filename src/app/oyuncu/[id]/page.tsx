import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfileView } from "@/components/ProfileView";
import { getPlayer, getProfile } from "@/lib/players";

type Props = { params: Promise<{ id: string }> };

/**
 * Herkese açık oyuncu profili ("Qadro Profilin"). Giriş yapmadan da açılır (middleware PUBLIC_PATHS),
 * çünkü "Başarını Paylaş" ile WhatsApp'a gönderilen bağlantıyı Qadro hesabı olmayan da görebilmeli.
 * E-posta gibi kişisel bilgi gösterilmez. SSR: her açılışta güncel.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const player = await getPlayer((await params).id);
  if (!player) return { title: "Oyuncu bulunamadı | Qadro" };
  return {
    title: `${player.name} | Qadro`,
    description: `${player.name} adlı oyuncunun Qadro profili: maçları, güvenilirliği, övgüleri ve başarımları.`,
  };
}

export default async function PlayerPage({ params }: Props) {
  const player = await getPlayer((await params).id);
  if (!player) notFound();
  return <ProfileView profile={await getProfile(player)} own={false} />;
}
