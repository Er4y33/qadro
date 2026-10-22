import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck, ExternalLink } from "lucide-react";
import { DemoStart } from "@/components/DemoStart";
import { DEMO_STEPS } from "@/lib/demo-steps";

export const metadata: Metadata = { title: "Oyunlaştırma Demosu | Qadro" };

const ROADMAP_URL = "https://github.com/Er4y33/qadro/blob/main/docs/oyunlastirma-rotasi.md";

/** Rotadaki her mekanik ve kodda nerede çalıştığı (demo turunda gösterilir) */
const MECHANICS = [
  { name: "XP ve seviye", note: "Yalnızca oylarla onaylanan maçlar XP kazandırır" },
  { name: "Güvenilirlik", note: "En az 3 oy ve çoğunlukla verilen Geldi/Gelmedi kararı" },
  { name: "Övgüler ve MVP", note: "Takım arkadaşından tanınma; MVP için en az 2 oy" },
  { name: "S.O.S çağrısı", note: "Veritabanında, ilk kabul eden kadroya girer" },
  { name: "Rozetler", note: "8 başarım, her biri bir hedef davranışa bağlı" },
  { name: "Haftalık seri", note: "Kayıp korkusu yaratmayan, bilgilendirici seri" },
  { name: "Sezonlar", note: "Üç ayda bir sıfırlanan sezon XP'si ve sıralaması" },
  { name: "Ölçüm paneli", note: "Gelmeme oranı, S.O.S yanıt süresi, katılım" },
];

export default async function DemoPage({ searchParams }: { searchParams: Promise<{ bitti?: string }> }) {
  const { bitti } = await searchParams;

  return (
    <main className="flex-1 px-5 pt-8 pb-16 lg:mx-auto lg:w-full lg:max-w-5xl lg:px-10 lg:pt-14">
      <Link href="/hosgeldin" className="flex items-center gap-2 text-xl font-black tracking-tight">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-base text-on-primary">Q</span>
        QADRO
      </Link>

      {bitti && (
        <p className="mt-6 flex items-center gap-2 rounded-xl border border-primary/50 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary" role="status">
          <CircleCheck size={18} /> Tur tamamlandı. Demoyu yeniden başlatırsan örnek veriler sıfırlanır.
        </p>
      )}

      <section className="mt-8 lg:grid lg:grid-cols-[1.1fr_1fr] lg:gap-12">
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">Oyunlaştırma Uygulamaları · Rehberli Demo</p>
          <h1 className="mt-3 text-3xl leading-tight font-black text-balance lg:text-5xl">
            Maça gelmeyen oyuncu sorununa oyunlaştırılmış çözüm
          </h1>
          <p className="mt-4 max-w-xl text-muted">
            Halı saha maçları çoğu zaman son dakika iptalleri ve gelmeyen oyuncular yüzünden yatar. Qadro; güvenilirlik, S.O.S, takım
            değerlendirmesi ve sezonlarla oyuncuları <strong className="text-fg">gerçekten gelmeye</strong> ve birbirine yardım etmeye
            yönlendirir. Tur yaklaşık 10 dakika sürer.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-start">
            <DemoStart label={bitti ? "Demoyu Yeniden Başlat" : "Demoyu Başlat"} />
            <a
              href={ROADMAP_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-5 py-3.5 text-sm font-semibold"
            >
              Rota belgesi <ExternalLink size={14} />
            </a>
          </div>
          <p className="mt-3 text-xs text-muted">
            Demo hesabı: Atahan. Başlatınca yalnızca demo maçları şimdiki zamana göre yeniden kurulur; her ekranda sağ altta bir rehber
            kartı ne deneyeceğini ve hangi kuramın çalıştığını gösterir.
          </p>
        </div>

        <ol className="mt-10 space-y-2 lg:mt-0" aria-label="Turun adımları">
          {DEMO_STEPS.map((step, i) => (
            <li key={step.id} className="flex gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary tabular-nums">
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{step.title}</span>
                <span className="block text-xs text-muted">{step.theory.map((t) => t.name).join(" · ")}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14">
        <h2 className="text-lg font-bold">Çalışan mekanikler</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MECHANICS.map((m) => (
            <li key={m.name} className="rounded-2xl border border-line bg-surface p-4">
              <p className="flex items-center gap-1.5 text-sm font-bold">
                <CircleCheck size={15} className="text-primary" /> {m.name}
              </p>
              <p className="mt-1 text-xs text-muted">{m.note}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
