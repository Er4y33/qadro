"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, SendHorizontal } from "lucide-react";
import { Avatar, cn } from "./ui";

export interface ChatMessageView {
  id: number;
  senderId: string;
  senderName: string;
  initials: string;
  color: string;
  body: string;
  createdAt: string;
}

const POLL_MS = 4000;
const MAX = 500;
const timeFmt = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit" });
const dayFmt = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "numeric", month: "long", weekday: "long" });
const dayKey = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date(iso));

/** Mesajdaki IBAN (TR + 24 rakam): kopyalanabilir kart olarak gösterilir */
function findIban(text: string): string | null {
  const m = text.match(/TR\d{2}(?:\s?\d{4}){5}\s?\d{2}/i);
  return m ? m[0].replace(/\s/g, "").toUpperCase().replace(/(.{4})/g, "$1 ").trim() : null;
}

/**
 * Takım sohbeti odası (istemci bileşeni).
 * İlk mesajlar sunucuda (SSR) gelir; sonra her 4 saniyede GET /api/matches/:id/messages?after=<son id> ile yeniler sorulur.
 * Sekme arka plandayken sorgu yapılmaz (pil ve veritabanı yükü).
 */
export function ChatRoom({ matchId, viewerId, initial }: { matchId: string; viewerId: string; initial: ChatMessageView[] }) {
  const [messages, setMessages] = useState(initial);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastId = messages.at(-1)?.id ?? 0;

  const merge = useCallback((incoming: ChatMessageView[]) => {
    if (incoming.length === 0) return;
    setMessages((all) => {
      const seen = new Set(all.map((m) => m.id));
      return [...all, ...incoming.filter((m) => !seen.has(m.id))].sort((a, b) => a.id - b.id);
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      const res = await fetch(`/api/matches/${matchId}/messages?after=${lastId}`, { cache: "no-store" }).catch(() => null);
      if (res?.ok) merge((await res.json()).messages);
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [matchId, lastId, merge]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    const res = await fetch(`/api/matches/${matchId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    }).catch(() => null);
    setSending(false);
    if (res?.status === 201) {
      merge([(await res.json()).message]);
      setText("");
    } else {
      const data = await res?.json().catch(() => ({}));
      setError(data?.error ?? "Mesaj gönderilemedi.");
    }
  };

  return (
    <>
      <main className="flex-1 space-y-3 px-4 py-4 pb-32" aria-live="polite">
        {messages.length === 0 && (
          <p className="mt-10 text-center text-sm text-muted">Henüz mesaj yok. Takıma ilk sen yaz: kim ne getiriyor, ücret nasıl ödenecek?</p>
        )}
        {messages.map((m, i) => {
          const newDay = i === 0 || dayKey(messages[i - 1].createdAt) !== dayKey(m.createdAt);
          const mine = m.senderId === viewerId;
          const iban = findIban(m.body);
          return (
            <div key={m.id}>
              {newDay && (
                <p className="mx-auto mb-3 w-fit rounded-full bg-surface-2 px-3 py-1 text-xs text-muted">
                  {dayKey(m.createdAt) === dayKey(new Date().toISOString()) ? "Bugün" : dayFmt.format(new Date(m.createdAt))}
                </p>
              )}
              {mine ? (
                <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-on-primary">
                  <p className="break-words whitespace-pre-wrap">{m.body}</p>
                  {iban && <IbanCard iban={iban} holder={m.senderName} mine />}
                  <time dateTime={m.createdAt} className="mt-1 block text-right text-[10px] text-on-primary/60">
                    {timeFmt.format(new Date(m.createdAt))}
                  </time>
                </div>
              ) : (
                <div className="flex max-w-[85%] items-start gap-2">
                  <Avatar player={m} size={30} />
                  <div className="min-w-0 rounded-2xl rounded-tl-sm border border-line bg-surface px-3 py-2 text-sm">
                    <p className="text-xs font-semibold text-warning">{m.senderName}</p>
                    <p className="break-words whitespace-pre-wrap">{m.body}</p>
                    {iban && <IbanCard iban={iban} holder={m.senderName} />}
                    <time dateTime={m.createdAt} className="mt-1 block text-right text-[10px] text-muted">
                      {timeFmt.format(new Date(m.createdAt))}
                    </time>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </main>

      <form
        onSubmit={send}
        className="fixed bottom-0 left-1/2 w-full max-w-[430px] -translate-x-1/2 border-t border-line bg-bg/95 px-4 pt-3 pb-6 backdrop-blur lg:left-[calc(50%+8rem)] lg:max-w-[520px]"
      >
        {error && <p className="mb-2 text-center text-xs font-semibold text-danger">{error}</p>}
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX))}
            placeholder="Mesaj yaz..."
            aria-label="Mesaj"
            maxLength={MAX}
            className="flex-1 rounded-full border border-line bg-surface px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            aria-label="Gönder"
            disabled={!text.trim() || sending}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary disabled:opacity-40"
          >
            <SendHorizontal size={18} />
          </button>
        </div>
        {text.length > MAX - 50 && <p className="mt-1 text-right text-[10px] text-muted">{MAX - text.length} karakter kaldı</p>}
      </form>
    </>
  );
}

function IbanCard({ iban, holder, mine }: { iban: string; holder: string; mine?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className={cn("mt-2 flex items-center gap-3 rounded-xl p-2", mine ? "bg-black/15" : "bg-surface-2")}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 font-bold text-primary">₺</span>
      <div className="min-w-0 text-xs">
        <p className={cn("truncate", mine ? "text-on-primary/80" : "text-muted")}>{iban}</p>
        <p className="font-semibold">{holder}</p>
      </div>
      <button
        type="button"
        aria-label="IBAN'ı kopyala"
        onClick={() => {
          navigator.clipboard?.writeText(iban.replace(/\s/g, "")).then(() => setCopied(true));
          setTimeout(() => setCopied(false), 1500);
        }}
        className="ml-auto opacity-70"
      >
        {copied ? <Check size={15} /> : <Copy size={15} />}
      </button>
    </div>
  );
}
