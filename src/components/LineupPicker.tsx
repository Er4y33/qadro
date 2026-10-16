"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type { LineupSlot, Sport } from "@/lib/types";
import { Avatar, cn } from "./ui";

/** Sahada seçilebilecek bölgeler. Dolu olanlar (başka bir oyuncunun durduğu yer) gösterilmez. */
const ZONES = [
  { id: "orta-saha", label: "Orta Saha", short: "OS", x: 50, y: 50 },
  { id: "sol-bek", label: "Sol Bek", short: "SolB", x: 16, y: 52 },
  { id: "sag-bek", label: "Sağ Bek", short: "SağB", x: 84, y: 52 },
  { id: "libero", label: "Libero", short: "Lib", x: 50, y: 74 },
];

export function LineupPicker({
  matchId,
  lineup,
  alreadyJoined,
  full,
}: {
  matchId: string;
  lineup: LineupSlot[];
  sport: Sport;
  alreadyJoined: boolean;
  full: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const taken = (z: { x: number; y: number }) => lineup.some((s) => Math.abs(s.x - z.x) < 8 && Math.abs(s.y - z.y) < 8);
  const openZones = alreadyJoined || full ? [] : ZONES.filter((z) => !taken(z));
  const zone = openZones.find((z) => z.id === selected);

  const join = () =>
    zone &&
    startTransition(async () => {
      setError(null);
      const res = await fetch(`/api/matches/${matchId}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position: zone.short, x: zone.x, y: zone.y }),
      });
      if (res.ok) {
        router.push(`/mac/${matchId}`);
        router.refresh();
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Katılım başarısız oldu.");
        router.refresh();
      }
    });

  return (
    <>
      <div className="mx-5 mt-4 flex-1">
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border-2 border-success/70 bg-pitch">
          {/* Saha çizgileri */}
          <div className="absolute inset-x-0 top-1/2 h-0.5 bg-success/50" />
          <div className="absolute top-1/2 left-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-success/50" />
          <div className="absolute top-0 left-1/2 h-[14%] w-[44%] -translate-x-1/2 border-2 border-t-0 border-success/50" />
          <div className="absolute top-0 left-1/2 h-[6%] w-[20%] -translate-x-1/2 border-2 border-t-0 border-success/50" />
          <div className="absolute bottom-0 left-1/2 h-[14%] w-[44%] -translate-x-1/2 border-2 border-b-0 border-success/50" />
          <div className="absolute bottom-0 left-1/2 h-[6%] w-[20%] -translate-x-1/2 border-2 border-b-0 border-success/50" />

          {lineup.map((slot) => (
            <div
              key={slot.player.id}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
              style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
            >
              <Avatar player={slot.player} size={42} badge={slot.overall} badgeTone={slot.overall >= 90 ? "success" : "warning"} />
              <span className="text-[11px] font-semibold whitespace-nowrap">
                {slot.player.name.split(" ")[0]} ({slot.position})
              </span>
            </div>
          ))}

          {openZones.map((z) => (
            <button
              key={z.id}
              type="button"
              onClick={() => setSelected(z.id)}
              aria-pressed={selected === z.id}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
              style={{ left: `${z.x}%`, top: `${z.y}%` }}
            >
              <span
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full border-2 border-dashed transition",
                  selected === z.id ? "border-success bg-success text-on-primary" : "border-danger text-danger",
                )}
              >
                <Plus size={18} />
              </span>
              <span className={cn("text-[11px] font-semibold", selected === z.id ? "text-success" : "text-danger")}>
                {selected === z.id ? "Seçildi" : "Bölge Seç"}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-5">
        {error && <p className="mb-2 text-center text-xs font-semibold text-danger">{error}</p>}
        {alreadyJoined ? (
          <p className="rounded-xl border border-dashed border-line py-3.5 text-center text-sm text-muted">Zaten kadrodasın</p>
        ) : full ? (
          <p className="rounded-xl border border-dashed border-line py-3.5 text-center text-sm text-muted">Kadro dolu</p>
        ) : zone ? (
          <button
            type="button"
            disabled={pending}
            onClick={join}
            className="block w-full rounded-xl bg-success py-3.5 text-center font-semibold text-on-primary shadow-lg shadow-success/30 disabled:opacity-50"
          >
            {pending ? "Katılınıyor..." : `${zone.label} Olarak Katıl`}
          </button>
        ) : (
          <p className="rounded-xl border border-dashed border-line py-3.5 text-center text-sm text-muted">
            Sahada boş bir bölgeye dokun
          </p>
        )}
      </div>
    </>
  );
}
