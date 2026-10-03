import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import type { Match } from "@/lib/types";
import { ProgressBar, cn } from "./ui";

export function MatchCard({ match }: { match: Match }) {
  const missing = match.capacity - match.joined;
  const urgent = match.tag === "acil";

  return (
    <Link
      href={`/mac/${match.id}`}
      className={cn(
        "block rounded-2xl border bg-surface p-4 transition hover:-translate-y-0.5",
        urgent ? "border-warning/30" : "border-success/40",
      )}
    >
      <span
        className={cn(
          "inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold",
          urgent ? "bg-warning/15 text-warning" : "bg-success/15 text-success",
        )}
      >
        {urgent ? "Acil" : "Yeni"}
      </span>

      <h3 className="mt-2 font-bold">
        {match.title} ({match.format})
      </h3>

      <div className="mt-2 space-y-1 text-xs text-muted">
        <p className="flex items-center gap-1.5">
          <MapPin size={13} /> {match.venue}
        </p>
        <p className="flex items-center gap-1.5 font-medium text-fg">
          <Clock size={13} className="text-muted" /> {match.dayLabel}, {match.time}
        </p>
      </div>

      <div className="mt-4 mb-2 flex items-center justify-between text-xs font-semibold">
        <span>
          {match.joined} / {match.capacity} Oyuncu
        </span>
        {missing > 0 && <span className="text-danger">{missing} Eksik</span>}
      </div>
      <ProgressBar value={match.joined} max={match.capacity} tone={urgent ? "warning" : "primary"} />
    </Link>
  );
}
