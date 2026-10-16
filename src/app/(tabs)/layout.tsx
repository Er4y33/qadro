import { BottomNav } from "@/components/BottomNav";

/** Alt menünün göründüğü ana sekmeler: Ana Sayfa, Keşfet, Sohbetler, Profil */
export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="flex-1 pb-28 lg:pb-12">{children}</main>
      <BottomNav />
    </>
  );
}
