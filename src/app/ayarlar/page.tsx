import type { Metadata } from "next";
import { ScreenHeader } from "@/components/ui";
import { SettingsForm } from "@/components/SettingsForm";
import { requireViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Ayarlar | Qadro" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const viewer = await requireViewer();
  return (
    <main className="flex-1 pb-12">
      <ScreenHeader title="Ayarlar" backHref="/profil" />
      <SettingsForm name={viewer.name} email={viewer.email} />
    </main>
  );
}
