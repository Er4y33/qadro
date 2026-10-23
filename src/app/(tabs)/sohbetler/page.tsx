import Link from "next/link";
import { Plus } from "lucide-react";
import { ChatList } from "@/components/ChatList";
import { listChats, listTeammates } from "@/lib/chat";
import { requireViewer } from "@/lib/session";

/** SSR: sohbet listesi ve okunmamış mesaj sayıları her açılışta veritabanından okunur. */
export const dynamic = "force-dynamic";

export default async function ChatsPage() {
  const viewer = await requireViewer();
  const [chats, teammates] = await Promise.all([listChats(viewer.id), listTeammates(viewer.id)]);

  return (
    <div className="px-5 pt-6 lg:mx-auto lg:max-w-2xl lg:pt-10">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sohbetler</h1>
        <Link
          href="/mac/olustur"
          aria-label="Yeni takım grubu: maç oluştur"
          title="Yeni maç oluştur: kadrosu için grup sohbeti açılır"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface"
        >
          <Plus size={20} />
        </Link>
      </header>
      <ChatList chats={chats} teammates={teammates} viewerId={viewer.id} />
    </div>
  );
}
