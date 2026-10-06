import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Copy, Plus, SendHorizontal } from "lucide-react";
import { Avatar } from "@/components/ui";
import { chatMessages, chats, getMatch } from "@/lib/mock-data";

export default async function ChatRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const chat = chats.find((c) => c.id === id);
  if (!chat) notFound();
  const match = getMatch(id);

  return (
    <>
      <header className="flex items-center gap-2 border-b border-line px-3 pt-5 pb-3">
        <Link href="/sohbetler" aria-label="Geri" className="flex h-10 w-10 items-center justify-center">
          <ChevronLeft size={24} />
        </Link>
        <div className="flex-1">
          <h1 className="font-semibold">{chat.title}</h1>
          {match && (
            <p className="text-xs font-medium text-success">
              {match.dayLabel}, {match.time} • {match.format}
            </p>
          )}
        </div>
        {match && (
          <span className="rounded-full border border-line px-2.5 py-1 text-xs font-semibold">
            {match.joined}/{match.capacity}
          </span>
        )}
      </header>

      <main className="flex-1 space-y-4 px-4 py-4 pb-28">
        <p className="mx-auto w-fit rounded-full bg-surface-2 px-3 py-1 text-xs text-muted">Bugün</p>

        {chatMessages.map((m) =>
          m.sender === "me" ? (
            <div key={m.id} className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-on-primary">
              {m.text}
              <span className="mt-1 block text-right text-[10px] text-on-primary/60">{m.time}</span>
            </div>
          ) : (
            <div key={m.id} className="flex max-w-[85%] items-start gap-2">
              <Avatar player={m.sender} size={30} />
              <div className="rounded-2xl rounded-tl-sm border border-line bg-surface px-3 py-2 text-sm">
                <p className="text-xs font-semibold text-warning">{m.sender.name}</p>
                {m.text && <p>{m.text}</p>}
                {m.iban && (
                  <div className="mt-1 flex items-center gap-3 rounded-xl bg-surface-2 p-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 font-bold text-primary">₺</span>
                    <div className="text-xs">
                      <p className="text-muted">{m.iban.number}</p>
                      <p className="font-semibold">{m.iban.holder}</p>
                    </div>
                    <button type="button" aria-label="IBAN kopyala" className="ml-auto text-muted">
                      <Copy size={15} />
                    </button>
                  </div>
                )}
                <span className="mt-1 block text-right text-[10px] text-muted">{m.time}</span>
              </div>
            </div>
          ),
        )}
      </main>

      <form className="fixed bottom-0 left-1/2 flex w-full max-w-[430px] -translate-x-1/2 items-center gap-2 border-t border-line bg-bg/95 px-4 pt-3 pb-6 backdrop-blur">
        <button type="button" aria-label="Ek ekle" className="flex h-10 w-10 items-center justify-center text-muted">
          <Plus size={22} />
        </button>
        <input placeholder="Mesaj yaz..." className="flex-1 rounded-full border border-line bg-surface px-4 py-2.5 text-sm outline-none" />
        <button type="submit" aria-label="Gönder" className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary">
          <SendHorizontal size={18} />
        </button>
      </form>
    </>
  );
}
