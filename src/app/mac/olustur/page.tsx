"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, MapPin, X } from "lucide-react";
import { cn } from "@/components/ui";
import { SPORT_LABELS, type Sport } from "@/lib/types";

const FORMATS: Record<Sport, string[]> = {
  futbol: ["5v5", "6v6", "7v7", "8v8"],
  basketbol: ["3v3", "5v5"],
  voleybol: ["4v4", "6v6"],
};

const VENUES = ["Elbistan Sentetik Saha", "Kahramanmaraş Merkez Saha", "Elbistan Spor Salonu"];

const field = "w-full rounded-xl border border-line bg-surface px-3 py-3 text-sm text-fg outline-none focus:border-primary";

export default function CreateMatchPage() {
  const router = useRouter();
  const [sport, setSport] = useState<Sport>("futbol");
  const [format, setFormat] = useState("7v7");
  const [isPublic, setIsPublic] = useState(true);

  const pickSport = (s: Sport) => {
    setSport(s);
    setFormat(FORMATS[s][0]);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    // TODO: Supabase bağlanınca POST /api/matches isteği gönderilecek (başarılıysa 201 Created).
    console.info("Yeni maç taslağı", { sport, format, isPublic, ...data });
    router.push("/");
  };

  return (
    <main className="flex-1 pb-32">
      <header className="relative flex items-center justify-center px-4 pt-5 pb-3">
        <Link href="/" aria-label="Kapat" className="absolute left-4 flex h-10 w-10 items-center justify-center">
          <X size={22} />
        </Link>
        <h1 className="font-semibold">Maç Oluştur</h1>
      </header>
      <div className="mx-5 h-1 rounded-full bg-surface-2">
        <div className="h-full w-1/2 rounded-full bg-primary" />
      </div>

      <form id="mac-olustur" onSubmit={onSubmit} className="space-y-6 px-5 pt-6">
        <fieldset>
          <legend className="mb-3 font-bold">Branş ve Format</legend>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(SPORT_LABELS) as Sport[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => pickSport(s)}
                className={cn(
                  "rounded-xl border py-3 text-sm font-semibold transition",
                  sport === s ? "border-primary bg-primary text-white" : "border-line bg-surface text-fg",
                )}
              >
                {SPORT_LABELS[s]}
              </button>
            ))}
          </div>
          <label className="relative mt-3 block">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted">Format</span>
            <select value={format} onChange={(e) => setFormat(e.target.value)} className={cn(field, "appearance-none pl-20 text-right pr-10 font-semibold")}>
              {FORMATS[sport].map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
            <ChevronDown size={18} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted" />
          </label>
        </fieldset>

        <fieldset>
          <legend className="mb-3 font-bold">Zaman ve Konum</legend>
          <div className="grid grid-cols-2 gap-2">
            <label className="rounded-xl border border-line bg-surface px-3 py-2">
              <span className="block text-[11px] text-muted">Tarih</span>
              <input name="date" type="date" required className="w-full bg-transparent text-sm font-semibold outline-none" />
            </label>
            <label className="rounded-xl border border-line bg-surface px-3 py-2">
              <span className="block text-[11px] text-muted">Saat</span>
              <input name="time" type="time" defaultValue="21:00" required className="w-full bg-transparent text-sm font-semibold outline-none" />
            </label>
          </div>
          <label className="relative mt-3 block">
            <MapPin size={18} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
            <select name="venue" className={cn(field, "appearance-none pl-10")}>
              {VENUES.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
            <ChevronDown size={18} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted" />
          </label>
        </fieldset>

        <fieldset>
          <legend className="mb-3 font-bold">Detaylar</legend>
          <div className="grid grid-cols-2 gap-2">
            <label className="rounded-xl border border-line bg-surface px-3 py-2">
              <span className="block text-[11px] text-muted">Kişi Başı Ücret</span>
              <span className="flex items-center font-semibold text-success">
                ₺<input name="price" type="number" min={0} defaultValue={120} className="w-full bg-transparent outline-none" />
              </span>
            </label>
            <label className="rounded-xl border border-line bg-surface px-3 py-2">
              <span className="block text-[11px] text-muted">Minimum Seviye</span>
              <span className="flex items-center font-semibold text-warning">
                Lvl.
                <input name="minLevel" type="number" min={1} defaultValue={10} className="ml-1 w-full bg-transparent outline-none" />
              </span>
            </label>
          </div>
          <textarea
            name="note"
            rows={3}
            placeholder="Ekstra bir not ekle... (Örn: Sadece defans)"
            className={cn(field, "mt-3 resize-none")}
          />
        </fieldset>

        <label className="flex items-center justify-between">
          <span className="font-semibold">Herkese Açık İlan (Keşfete Düşer)</span>
          <button
            type="button"
            role="switch"
            aria-checked={isPublic}
            onClick={() => setIsPublic((v) => !v)}
            className={cn("relative h-7 w-12 rounded-full transition", isPublic ? "bg-primary" : "bg-surface-2")}
          >
            <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white transition-all", isPublic ? "left-6" : "left-1")} />
          </button>
        </label>
      </form>

      <div className="fixed bottom-0 left-1/2 w-full max-w-[430px] -translate-x-1/2 border-t border-line bg-bg/95 px-5 pt-3 pb-6 backdrop-blur">
        <button
          type="submit"
          form="mac-olustur"
          className="w-full rounded-xl bg-primary py-3.5 font-semibold text-white shadow-lg shadow-primary/30"
        >
          Devam Et (Saha Seçimi)
        </button>
      </div>
    </main>
  );
}
