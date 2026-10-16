import Link from "next/link";
import { Trophy, Users, Zap } from "lucide-react";

const FEATURES = [
  { icon: Zap, title: "Eksik oyuncuyu dakikalar içinde bul", text: "S.O.S çağrısı çevrendeki uygun oyunculara anında ulaşır." },
  { icon: Users, title: "Kadronu kur, sahada yerini seç", text: "Halı saha, basketbol, voleybol ve tenis maçları tek yerde." },
  { icon: Trophy, title: "Oyna, değerlendir, seviye atla", text: "Güvenilirlik puanı, övgüler ve başarımlarla itibarını büyüt." },
];

/**
 * Giriş, kayıt ve tanıtım ekranlarının çerçevesi.
 * Telefonda yalnızca form görünür; masaüstünde solda tanıtım paneli, sağda form (bölünmüş ekran).
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col lg:grid lg:min-h-dvh lg:grid-cols-[1fr_520px]">
      <aside className="relative hidden overflow-hidden bg-surface p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-primary/15" />
        <div className="pointer-events-none absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-primary/10" />

        <Link href="/hosgeldin" className="relative flex items-center gap-2 text-2xl font-black tracking-tight">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg text-on-primary">Q</span>
          QADRO
        </Link>

        <div className="relative max-w-lg">
          <h2 className="text-5xl leading-tight font-black">
            Eksik oyuncu
            <br />
            <span className="text-primary">derdine son.</span>
          </h2>
          <ul className="mt-10 space-y-6">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Icon size={22} />
                </span>
                <span>
                  <span className="block font-semibold">{title}</span>
                  <span className="block text-sm text-muted">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-muted">Web Programlama ve Oyunlaştırma Uygulamaları dönem projesi</p>
      </aside>

      <div className="flex flex-1 flex-col lg:border-l lg:border-line">{children}</div>
    </div>
  );
}
