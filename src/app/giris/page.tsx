"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const input =
  "w-full rounded-xl border border-line bg-surface px-4 py-3.5 text-sm text-fg outline-none placeholder:text-muted focus:border-primary";

export default function LoginPage() {
  const router = useRouter();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Supabase Auth ile giriş. Hatalı şifrede API 401 Unauthorized döner.
    router.push("/");
  };

  return (
    <main className="flex flex-1 flex-col px-7 pt-20 pb-10">
      <h1 className="text-3xl font-bold">Sahaya Dön!</h1>
      <p className="mt-2 text-sm text-muted">Kaldığın yerden maçlara katılmaya devam et.</p>

      <form onSubmit={onSubmit} className="mt-10 space-y-5">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">E-posta Adresi</span>
          <input type="email" required autoComplete="email" placeholder="ornek@qadro.com" className={input} />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Şifre</span>
          <input type="password" required autoComplete="current-password" placeholder="••••••••" className={input} />
        </label>
        <div className="-mt-2 text-right">
          <Link href="#" className="text-xs font-semibold text-primary">
            Şifremi Unuttum?
          </Link>
        </div>
        <button type="submit" className="w-full rounded-xl bg-primary py-3.5 font-semibold text-on-primary shadow-lg shadow-primary/30">
          Giriş Yap
        </button>
      </form>

      <div className="my-8 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" /> veya <span className="h-px flex-1 bg-line" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button type="button" className="flex items-center justify-center gap-2 rounded-xl border border-line bg-surface py-3 text-sm font-semibold">
          <span className="h-3 w-3 rounded-full bg-danger" /> Google
        </button>
        <button type="button" className="flex items-center justify-center gap-2 rounded-xl border border-line bg-surface py-3 text-sm font-semibold">
          <span className="h-3 w-3 rounded-full bg-fg" /> Apple
        </button>
      </div>

      <p className="mt-auto pt-10 text-center text-sm text-muted">
        Henüz hesabın yok mu?{" "}
        <Link href="#" className="font-semibold text-primary">
          Kayıt Ol
        </Link>
      </p>
    </main>
  );
}
