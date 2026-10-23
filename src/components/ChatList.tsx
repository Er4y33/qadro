"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { ChatSummary, Teammate } from "@/lib/chat";
import { Avatar, cn } from "./ui";

const toneBySport = {
  futbol: "border-success/50 bg-success/10 text-success",
  basketbol: "border-warning/50 bg-warning/10 text-warning",
  voleybol: "border-violet/50 bg-violet/10 text-violet",
  tenis: "border-primary/50 bg-primary/10 text-primary",
} as const;

const TZ = "Europe/Istanbul";
const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);

/** WhatsApp gibi: bugünse saat, dünse "Dün", bu hafta içindeyse gün adı, daha eskiyse tarih */
function when(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (dayKey(d) === dayKey(now)) return new Intl.DateTimeFormat("tr-TR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(d);
  if (dayKey(d) === dayKey(new Date(now.getTime() - 86_400_000))) return "Dün";
  if (now.getTime() - d.getTime() < 6 * 86_400_000) return new Intl.DateTimeFormat("tr-TR", { timeZone: TZ, weekday: "long" }).format(d);
  return new Intl.DateTimeFormat("tr-TR", { timeZone: TZ, day: "numeric", month: "short" }).format(d);
}

/** Sohbetler ekranı: "Takım Grupları" (maç sohbetleri) ve "Kişiler" (birlikte oynanan oyuncular), aramayla */
export function ChatList({ chats, teammates, viewerId }: { chats: ChatSummary[]; teammates: Teammate[]; viewerId: string }) {
  const [tab, setTab] = useState<"groups" | "people">("groups");
  const [query, setQuery] = useState("");
  const q = query.trim().toLocaleLowerCase("tr");
  const shownChats = chats.filter((c) => !q || c.title.toLocaleLowerCase("tr").includes(q) || c.lastMessage?.toLocaleLowerCase("tr").includes(q));
  const shownPeople = teammates.filter((p) => !q || p.name.toLocaleLowerCase("tr").includes(q));

  return (
    <>
      <div className="mt-5 grid grid-cols-2 rounded-xl bg-surface-2 p-1 text-sm font-medium" role="tablist">
        {(
          [
            ["people", `Kişiler (${teammates.length})`],
            ["groups", `Takım Grupları (${chats.length})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn("rounded-lg py-2 transition", tab === id ? "bg-primary text-on-primary shadow" : "text-muted")}
          >
            {label}
          </button>
        ))}
      </div>

      <label className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-muted">
        <Search size={16} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tab === "groups" ? "Sohbet ara..." : "Oyuncu ara..."}
          className="w-full bg-transparent text-fg outline-none placeholder:text-muted"
        />
      </label>

      {tab === "groups" ? (
        <ul className="mt-4 divide-y divide-line">
          {shownChats.map((c) => (
            <li key={c.matchId}>
              <Link href={`/sohbetler/${c.matchId}`} className="flex items-center gap-3 py-4">
                <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-xs font-bold", toneBySport[c.sport])}>
                  {c.format}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{c.title}</p>
                  <p className="truncate text-sm text-muted">
                    {c.lastMessage ? (
                      <>
                        <span className="font-medium text-fg">{c.lastSenderId === viewerId ? "Sen" : c.lastSender}:</span> {c.lastMessage}
                      </>
                    ) : (
                      "Henüz mesaj yok"
                    )}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {c.lastAt && <span className={cn("text-xs", c.unread ? "font-semibold text-success" : "text-muted")}>{when(c.lastAt)}</span>}
                  {c.unread > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-warning px-1 text-[11px] font-bold text-white">
                      {c.unread}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
          {shownChats.length === 0 && (
            <li className="py-10 text-center text-sm text-muted">
              {chats.length === 0 ? "Bir maça katıldığında takımın sohbeti burada açılır." : "Aramayla eşleşen sohbet yok."}
            </li>
          )}
        </ul>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {shownPeople.map((p) => (
            <li key={p.id}>
              <Link href={`/oyuncu/${p.id}`} className="flex items-center gap-3 py-3">
                <Avatar player={p} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.name}</p>
                  <p className="text-xs text-muted">
                    Seviye {p.level} · {p.together} maçta birlikte
                  </p>
                </div>
              </Link>
            </li>
          ))}
          {shownPeople.length === 0 && (
            <li className="py-10 text-center text-sm text-muted">
              {teammates.length === 0 ? "Birlikte maç yaptığın oyuncular burada listelenir." : "Aramayla eşleşen oyuncu yok."}
            </li>
          )}
        </ul>
      )}
    </>
  );
}
