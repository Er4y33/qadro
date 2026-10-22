"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import type { OpenSosCall } from "@/lib/sos";
import { SPORT_EMOJI } from "@/lib/sports";

const timeFmt = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit" });

function startsIn(iso: string) {
  const minutes = Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 60_000));
  if (minutes < 60) return `Başlamasına ${minutes} dk var`;
  const hours = Math.floor(minutes / 60);
  return `Başlamasına ${hours} sa ${minutes % 60} dk var`;
}

/**
 * Açık S.O.S çağrıları (veritabanından). "Kabul Et" → POST /api/sos/:id/answer → oyuncu kadroya eklenir.
 * Hook modelindeki tetikleyicinin (bildirim) eyleme dönüştüğü yer.
 */
export function SosInbox({ calls, rescuerProgress }: { calls: OpenSosCall[]; rescuerProgress: { current: number; target: number } }) {
  if (calls.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line p-4 text-center text-sm text-muted">
        Şu an çevrende açık bir S.O.S çağrısı yok.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {calls.map((call) => (
        <SosCard key={call.id} call={call} rescuerProgress={rescuerProgress} />
      ))}
    </ul>
  );
}

function SosCard({ call, rescuerProgress }: { call: OpenSosCall; rescuerProgress: { current: number; target: number } }) {
  const [state, setState] = useState<"open" | "accepted">("open");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const accept = () =>
    startTransition(async () => {
      setError(null);
      const res = await fetch(`/api/sos/${call.id}/answer`, { method: "POST" });
      if (res.status === 201) setState("accepted");
      else setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Çağrı kabul edilemedi.");
    });

  if (state === "accepted") {
    const next = Math.min(rescuerProgress.current + 1, rescuerProgress.target);
    return (
      <li className="rounded-2xl border-2 border-primary/60 bg-primary/10 p-4" aria-live="polite">
        <p className="flex items-center gap-2 font-bold text-primary">
          <LifeBuoy size={18} /> Kadroya eklendin!
        </p>
        <p className="mt-1 text-sm">
          {call.matchTitle} maçında seni bekliyorlar. <span className="font-bold text-primary">+40 XP</span> · Kurtarıcı başarımı{" "}
          <span className="font-semibold">
            {next} / {rescuerProgress.target}
          </span>
        </p>
        <Link href={`/mac/${call.matchId}`} className="mt-3 inline-block rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-on-primary">
          Maça Git
        </Link>
      </li>
    );
  }

  return (
    <li className="flex gap-3 rounded-2xl border-2 border-danger/70 bg-danger/10 p-4">
      <span className="relative mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-dashed border-danger/60">
        <span className="h-3 w-3 animate-pulse rounded-full bg-danger" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-bold">
            Acil {call.position} Aranıyor! {SPORT_EMOJI[call.sport]}
          </p>
          <span className="shrink-0 text-[11px] font-bold text-danger">{timeFmt.format(new Date(call.startsAt))}</span>
        </div>
        <p className="text-xs text-muted">
          {call.matchTitle} • {call.format} • {call.venueShort}
        </p>
        <p className="text-xs text-muted">
          {startsIn(call.startsAt)} • {call.openSlots} kişi eksik • Çağıran: {call.createdBy}
        </p>
        {error && (
          <p className="mt-2 text-xs font-semibold text-danger" role="alert">
            {error}
          </p>
        )}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={accept}
            disabled={pending}
            className="rounded-lg bg-danger px-4 py-1.5 text-xs font-bold text-white disabled:opacity-60"
          >
            {pending ? "Ekleniyor..." : "Kabul Et, Kadroya Gir"}
          </button>
          <Link href={`/mac/${call.matchId}`} className="rounded-lg border border-line px-4 py-1.5 text-xs font-semibold">
            Maçı Gör
          </Link>
        </div>
      </div>
    </li>
  );
}
