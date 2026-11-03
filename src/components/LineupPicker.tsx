"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type { LineupSlot, Sport } from "@/lib/types";
import { isTaken, tennisRole, zonesFor } from "@/lib/courts";
import { CourtLines } from "./CourtLines";
import { Avatar, cn } from "./ui";

export function LineupPicker({
  matchId,
  lineup,
  sport,
  format,
  viewerId,
  alreadyJoined,
  full,
}: {
  matchId: string;
  lineup: LineupSlot[];
  sport: Sport;
  format: string;
  viewerId: string;
  alreadyJoined: boolean;
  full: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const zones = zonesFor(sport, format);
  const freeZones = zones.filter((z) => !isTaken(z, lineup));
  const openZones = alreadyJoined || full ? [] : freeZones;
  const zone = openZones.find((z) => z.id === selected);

  // Tenis: roller izleyiciye göre (kendi tarafın Partner, karşı taraf Rakip). Kadroda değilsen ilk katılanın tarafı esas alınır.
  const tennis = sport === "tenis";
  const referenceY = (lineup.find((s) => s.player.id === viewerId) ?? lineup[0])?.y;
  const courtRoleFromHost = (y: number) => (tennisRole(y, referenceY) === "Partner" ? "Ev Sahibi" : "Rakip");
  const slotLabel = (slot: LineupSlot) => {
    if (slot.player.id === viewerId) return "Sen";
    if (!tennis) return slot.position;
    if (!alreadyJoined) return slot === lineup[0] ? "Organizatör" : courtRoleFromHost(slot.y);
    return tennisRole(slot.y, referenceY);
  };
  const zoneLabel = (z: { label: string; y: number }) => (tennis ? tennisRole(z.y, referenceY) : z.label);

  // Bütün bölgeler doluysa ama kontenjan varsa mevki seçmeden katılınabilir (yedek oyuncu)
  const noZoneLeft = !alreadyJoined && !full && freeZones.length === 0;

  const join = () =>
    (zone || noZoneLeft) &&
    startTransition(async () => {
      setError(null);
      const res = await fetch(`/api/matches/${matchId}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(zone ? { position: zone.short, x: zone.x, y: zone.y } : {}),
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
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border-2 border-primary/60 bg-pitch">
          <CourtLines sport={sport} />

          {lineup.map((slot) => (
            <div
              key={slot.player.id}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
              style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
            >
              <Avatar player={slot.player} size={42} badge={slot.overall} badgeTone={slot.overall >= 90 ? "success" : "warning"} />
              <span className="text-[11px] font-semibold whitespace-nowrap">
                {slot.player.name.split(" ")[0]} ({slotLabel(slot)})
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
                  selected === z.id ? "border-primary bg-primary text-on-primary" : "border-primary/70 bg-pitch/60 text-primary",
                )}
              >
                <Plus size={18} />
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
                  selected === z.id ? "bg-primary text-on-primary" : "bg-primary/15 text-primary",
                )}
              >
                {selected === z.id ? "Seçildi" : `Boş (${zoneLabel(z)})`}
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
            className="block w-full rounded-xl bg-primary py-3.5 text-center font-semibold text-on-primary shadow-lg shadow-primary/30 disabled:opacity-50"
          >
            {pending ? "Katılınıyor..." : `${zoneLabel(zone)} Olarak Katıl`}
          </button>
        ) : noZoneLeft ? (
          <button
            type="button"
            disabled={pending}
            onClick={join}
            className="block w-full rounded-xl bg-primary py-3.5 text-center font-semibold text-on-primary shadow-lg shadow-primary/30 disabled:opacity-50"
          >
            {pending ? "Katılınıyor..." : "Yedek Olarak Katıl"}
          </button>
        ) : (
          <p className="rounded-xl border border-dashed border-line py-3.5 text-center text-sm text-muted">
            {tennis ? "Kortta boş bir yere dokun" : "Sahada boş bir mevkiye dokun"}
          </p>
        )}
      </div>
    </>
  );
}
