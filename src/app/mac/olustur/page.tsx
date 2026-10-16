import type { Metadata } from "next";
import { CreateMatchWizard } from "@/components/CreateMatchWizard";
import { venues } from "@/lib/mock-data";
import { countOrganized } from "@/lib/players";
import { requireViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Maç Oluştur | Qadro" };

/**
 * Sayfanın kendisi sunucu bileşenidir: saha listesini sunucuda hazırlar.
 * Etkileşimli 3 adımlı form ise istemci bileşenidir (CSR).
 */
export default async function CreateMatchPage() {
  const viewer = await requireViewer();
  return <CreateMatchWizard venues={venues} organizedBefore={await countOrganized(viewer.id)} />;
}
