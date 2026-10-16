import type { Metadata } from "next";
import { CreateMatchWizard } from "@/components/CreateMatchWizard";
import { currentUser, venues } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Maç Oluştur | Qadro" };

/**
 * Sayfanın kendisi sunucu bileşenidir: saha listesini sunucuda hazırlar.
 * Etkileşimli 3 adımlı form ise istemci bileşenidir (CSR).
 */
export default function CreateMatchPage() {
  return <CreateMatchWizard venues={venues} organizedBefore={currentUser.stats.matchesOrganized} />;
}
