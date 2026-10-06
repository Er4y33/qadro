import { Search } from "lucide-react";

/** Figma'daki açılış (splash) ekranı. Sayfa yüklenirken Next.js bunu otomatik gösterir. */
export default function Loading() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center">
      <div className="relative flex h-56 w-56 items-center justify-center rounded-full border border-dashed border-primary/40">
        <div className="flex h-36 w-36 items-center justify-center rounded-full border-2 border-primary/60">
          <div className="flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-primary text-white shadow-[0_0_40px] shadow-primary/60">
            <Search size={30} />
          </div>
        </div>
      </div>
      <p className="mt-8 font-bold tracking-wide">QADRO</p>
      <p className="text-xs text-muted">Sahaya İniliyor...</p>
    </main>
  );
}
