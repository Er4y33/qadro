import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { cn } from "@/components/ui";
import { chats } from "@/lib/mock-data";

const toneClass = {
  success: "border-success/50 bg-success/10 text-success",
  primary: "border-primary/50 bg-primary/10 text-primary",
  violet: "border-violet/50 bg-violet/10 text-violet",
} as const;

export default function ChatsPage() {
  return (
    <div className="px-5 pt-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sohbetler</h1>
        <button type="button" aria-label="Yeni sohbet" className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface">
          <Plus size={20} />
        </button>
      </header>

      <div className="mt-5 grid grid-cols-2 rounded-xl bg-surface-2 p-1 text-sm font-medium">
        <button type="button" className="rounded-lg py-2 text-muted">Kişiler</button>
        <button type="button" className="rounded-lg bg-primary py-2 text-white shadow">Takım Grupları</button>
      </div>

      <label className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-muted">
        <Search size={16} />
        <input placeholder="Sohbet ara..." className="w-full bg-transparent text-fg outline-none placeholder:text-muted" />
      </label>

      <ul className="mt-4 divide-y divide-line">
        {chats.map((c) => (
          <li key={c.id}>
            <Link href={`/sohbetler/${c.id}`} className="flex items-center gap-3 py-4">
              <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-xs font-bold", toneClass[c.tone])}>
                {c.format}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{c.title}</p>
                <p className="truncate text-sm text-muted">
                  <span className="font-medium text-fg">{c.lastSender}:</span> {c.lastMessage}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={cn("text-xs", c.unread ? "font-semibold text-success" : "text-muted")}>{c.time}</span>
                {c.unread > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-warning px-1 text-[11px] font-bold text-white">
                    {c.unread}
                  </span>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
