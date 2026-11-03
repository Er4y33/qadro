"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Plus, Trash2, UsersRound } from "lucide-react";
import type { Teammate } from "@/lib/chat";
import type { Team } from "@/lib/teams";
import { SPORT_EMOJI } from "@/lib/sports";
import { SPORT_LABELS, type Sport } from "@/lib/types";
import { Avatar, cn } from "./ui";

/**
 * Takımlar = kayıtlı kadrolar ("Cuma Halı Saha Tayfası").
 * Kemik kadro bir kez kaydedilir; yeni maç açarken takım seçilince herkese davet gider ve ortak sohbet açılır.
 * Takıma yalnızca daha önce birlikte oynadığın oyuncular eklenebilir.
 */
export function TeamManager({
  viewerId,
  teams,
  teammates,
}: {
  viewerId: string;
  teams: Team[];
  teammates: Teammate[];
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(teams.length === 0);
  const [name, setName] = useState("");
  const [sport, setSport] = useState<Sport>("futbol");
  const [selected, setSelected] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  const toggle = (id: string) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );

  const create = () =>
    startTransition(async () => {
      setErrors([]);
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, sport, memberIds: selected }),
      });
      if (res.status === 201) {
        setCreating(false);
        setName("");
        setSelected([]);
        router.refresh();
      } else {
        const body = await res.json().catch(() => ({}));
        setErrors(body.errors ?? ["Takım kaydedilemedi."]);
      }
    });

  const remove = (id: string) =>
    startTransition(async () => {
      await fetch(`/api/teams/${id}`, { method: "DELETE" });
      router.refresh();
    });

  return (
    <div className="px-5 pb-8">
      <p className="text-sm text-muted">
        Sık oynadığın kemik kadroyu bir kez kaydet. Yeni maç açarken takımı seç:
        herkese davet gider, hepsi maçın sohbetine katılır. Tek tek 14 kişiyi
        davet etmekle uğraşma.
      </p>

      <ul className="mt-4 space-y-3">
        {teams.map((t) => (
          <li
            key={t.id}
            data-sport={t.sport}
            className="rounded-2xl border border-line bg-surface p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold">{t.name}</p>
                <p className="text-xs font-semibold text-primary">
                  {SPORT_EMOJI[t.sport]} {SPORT_LABELS[t.sport]} ·{" "}
                  {t.members.length} kişi
                  {t.ownerId === viewerId ? " · Kurucusun" : ""}
                </p>
              </div>
              {t.ownerId === viewerId && (
                <button
                  type="button"
                  aria-label={`${t.name} takımını sil`}
                  disabled={pending}
                  onClick={() => remove(t.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:text-danger"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <div className="mt-3 flex items-center">
              {t.members.slice(0, 7).map((m, i) => (
                <Avatar
                  key={m.id}
                  player={m}
                  size={34}
                  className={cn("border-2 border-surface", i > 0 && "-ml-2")}
                />
              ))}
              {t.members.length > 7 && (
                <span className="ml-2 text-xs text-muted">
                  +{t.members.length - 7}
                </span>
              )}
            </div>
            {
              <Link
                href={`/mac/olustur?takim=${t.id}`}
                className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-sm font-semibold text-on-primary"
              >
                <Plus size={16} /> Bu Takımla Maç Aç
              </Link>
            }
          </li>
        ))}
      </ul>

      {!creating ? (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/60 py-3 text-sm font-semibold text-primary"
        >
          <UsersRound size={16} /> Yeni Takım Kaydet
        </button>
      ) : (
        <section
          data-sport={sport}
          className="mt-4 space-y-4 rounded-2xl border border-primary/40 bg-surface p-4"
        >
          <h2 className="font-bold">Yeni Takım</h2>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder="Örn: Cuma Halı Saha Tayfası"
            className="w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <div className="flex flex-wrap gap-2">
            {(Object.keys(SPORT_LABELS) as Sport[]).map((s) => (
              <button
                key={s}
                type="button"
                data-sport={s}
                aria-pressed={sport === s}
                onClick={() => setSport(s)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-semibold",
                  sport === s
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-line text-muted",
                )}
              >
                {SPORT_EMOJI[s]} {SPORT_LABELS[s]}
              </button>
            ))}
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-muted">
              Birlikte oynadığın oyuncular ({selected.length} seçildi, sen
              otomatik eklenirsin)
            </p>
            {teammates.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line p-4 text-center text-sm text-muted">
                Henüz kimseyle aynı kadroda oynamadın. İlk maçından sonra takım
                kurabilirsin.
              </p>
            ) : (
              <ul className="max-h-72 space-y-1.5 overflow-y-auto">
                {teammates.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      aria-pressed={selected.includes(p.id)}
                      onClick={() => toggle(p.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left",
                        selected.includes(p.id)
                          ? "border-primary bg-primary/10"
                          : "border-line",
                      )}
                    >
                      <Avatar player={p} size={32} />
                      <span className="flex-1">
                        <span className="block text-sm font-semibold">
                          {p.name}
                        </span>
                        <span className="text-xs text-muted">
                          {p.together} maç birlikte · Seviye {p.level}
                        </span>
                      </span>
                      {selected.includes(p.id) && (
                        <Check size={18} className="text-primary" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {errors.map((e) => (
            <p key={e} className="text-xs font-semibold text-danger">
              {e}
            </p>
          ))}
          <div className="flex gap-2">
            {teams.length > 0 && (
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="flex-1 rounded-xl border border-line py-2.5 text-sm font-semibold"
              >
                Vazgeç
              </button>
            )}
            <button
              type="button"
              disabled={
                pending || name.trim().length < 2 || selected.length === 0
              }
              onClick={create}
              className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-on-primary disabled:opacity-40"
            >
              {pending ? "Kaydediliyor..." : "Takımı Kaydet"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
