"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { LineupSlot } from "@/lib/types";
import { Avatar, cn } from "./ui";

/** Boş kalan bölgeler. Şimdilik sabit; ileride maçın formatına göre hesaplanacak. */
const OPEN_ZONES = [{ id: "orta-saha", label: "Orta Saha", x: 50, y: 50 }];

export function LineupPicker({ matchId, lineup }: { matchId: string; lineup: LineupSlot[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const zone = OPEN_ZONES.find((z) => z.id === selected);

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

          {OPEN_ZONES.map((z) => (
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
                  selected === z.id ? "border-success bg-success text-white" : "border-danger text-danger",
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
        {zone ? (
          <Link
            href={`/mac/${matchId}?katildi=1`}
            className="block rounded-xl bg-success py-3.5 text-center font-semibold text-white shadow-lg shadow-success/30"
          >
            {zone.label} Olarak Katıl
          </Link>
        ) : (
          <p className="rounded-xl border border-dashed border-line py-3.5 text-center text-sm text-muted">
            Sahada boş bir bölgeye dokun
          </p>
        )}
      </div>
    </>
  );
}
