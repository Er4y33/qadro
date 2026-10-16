"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleCheck, Crown, MessageSquare, X } from "lucide-react";
import type { Sport } from "@/lib/types";

/**
 * Maç detayının alt çubuğu: Katıl / Ayrıl.
 * İstekler REST API'ye gider; başarılı olunca sayfa sunucudan yeniden çizilir (router.refresh).
 */
export function MatchActions({
  matchId,
  sport,
  joined,
  isOrganizer,
  full,
}: {
  matchId: string;
  sport: Sport;
  joined: boolean;
  isOrganizer: boolean;
  full: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const call = (method: "POST" | "DELETE") =>
    startTransition(async () => {
      setError(null);
      const res = await fetch(`/api/matches/${matchId}/participants`, { method });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Bir şeyler ters gitti.");
      }
      router.refresh();
    });

  return (
    // Telefonda ekranın altına sabit; masaüstünde sağ kolonun sonunda normal akışta
    <div className="fixed bottom-0 left-1/2 w-full max-w-[430px] -translate-x-1/2 border-t border-line bg-bg/95 px-5 pt-3 pb-6 backdrop-blur lg:static lg:mt-8 lg:max-w-none lg:translate-x-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
      {error && <p className="mb-2 text-center text-xs font-semibold text-danger">{error}</p>}

      {joined ? (
        <>
          <p className="mb-2 flex items-center justify-center gap-1 text-xs font-semibold text-success">
            {isOrganizer ? (
              <>
                <Crown size={14} /> Bu maçın organizatörüsün
              </>
            ) : (
              <>
                <CircleCheck size={14} /> Kadrodasın!
              </>
            )}
          </p>
          <div className="flex gap-3">
            <Link
              href={`/sohbetler/${matchId}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-semibold text-on-primary"
            >
              <MessageSquare size={18} /> Takım Sohbeti
            </Link>
            {!isOrganizer && (
              <button
                type="button"
                disabled={pending}
                onClick={() => call("DELETE")}
                className="flex w-16 flex-col items-center justify-center rounded-xl border border-danger/40 bg-danger/10 text-[10px] font-semibold text-danger disabled:opacity-50"
              >
                <X size={18} /> Ayrıl
              </button>
            )}
          </div>
        </>
      ) : full ? (
        <p className="rounded-xl border border-line py-3.5 text-center font-semibold text-muted">Kadro dolu</p>
      ) : sport === "futbol" ? (
        // Futbolda önce sahada bir bölge seçilir
        <Link
          href={`/mac/${matchId}/dizilim`}
          className="block rounded-xl bg-primary py-3.5 text-center font-semibold text-on-primary shadow-lg shadow-primary/30"
        >
          Maça Katıl
        </Link>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => call("POST")}
          className="w-full rounded-xl bg-primary py-3.5 font-semibold text-on-primary shadow-lg shadow-primary/30 disabled:opacity-50"
        >
          {pending ? "Katılınıyor..." : "Maça Katıl"}
        </button>
      )}
    </div>
  );
}
