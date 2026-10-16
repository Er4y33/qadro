import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheck, Clock, Lock } from "lucide-react";
import { TeamReview } from "@/components/TeamReview";
import { requireViewer } from "@/lib/session";
import { getProfile } from "@/lib/players";
import { getReviewContext } from "@/lib/reviews";

export const dynamic = "force-dynamic";

const NOTICES = {
  not_member: { icon: Lock, title: "Bu maçta oynamadın", text: "Yalnızca maçın kadrosundaki oyuncular takımı değerlendirebilir." },
  not_started: { icon: Clock, title: "Maç henüz oynanmadı", text: "Değerlendirme, maç başladıktan sonra açılır." },
  already_reviewed: { icon: CircleCheck, title: "Bu maçı değerlendirdin", text: "Oyların kaydedildi. Teşekkürler, adil oyun böyle büyür!" },
} as const;

export default async function TeamReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await requireViewer();
  const context = await getReviewContext(id, viewer.id);
  if (!context) notFound();

  if (context.state !== "open") {
    const { icon: Icon, title, text } = NOTICES[context.state];
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Icon size={34} />
        </span>
        <h1 className="mt-5 text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-muted">{text}</p>
        <Link href={`/mac/${id}`} className="mt-8 w-full rounded-xl bg-primary py-3.5 font-bold text-on-primary">
          Maça Dön
        </Link>
      </main>
    );
  }

  const profile = await getProfile(viewer);
  return <TeamReview matchId={id} teammates={context.teammates} ratingsGivenBefore={profile.stats.ratingsGiven} />;
}
