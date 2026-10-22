"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import { AuthShell } from "./AuthShell";

const input =
  "w-full rounded-xl border border-line bg-surface px-4 py-3.5 text-sm text-fg outline-none placeholder:text-muted focus:border-primary";

/**
 * Giriş ve kayıt formu (tek bileşen, iki mod).
 * Form REST API'ye JSON gönderir; başarılıysa sunucu oturum çerezini yazar ve ana sayfaya geçilir.
 */
export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [errors, setErrors] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [pending, startTransition] = useTransition();
  const isRegister = mode === "register";

  const send = (url: string, body?: Record<string, FormDataEntryValue>) =>
    startTransition(async () => {
      setErrors([]);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      if (res.ok) {
        router.push("/");
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => ({}));
      setErrors(data.errors ?? [data.error ?? "Bir şeyler ters gitti, tekrar dene."]);
    });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    send(isRegister ? "/api/auth/register" : "/api/auth/login", Object.fromEntries(new FormData(e.currentTarget)));
  };

  return (
    <AuthShell>
      <main className="flex flex-1 flex-col px-7 pt-20 pb-10 lg:justify-center lg:px-14 lg:pt-10">
        <h1 className="text-3xl font-bold">{isRegister ? "Sahaya Adım At!" : "Sahaya Dön!"}</h1>
        <p className="mt-2 text-sm text-muted">
          {isRegister ? "Hesabını oluştur, çevrendeki maçlara hemen katıl." : "Kaldığın yerden maçlara katılmaya devam et."}
        </p>

        <form onSubmit={onSubmit} className="mt-10 space-y-5">
          {isRegister && (
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Ad Soyad</span>
              <input
                name="name"
                required
                minLength={2}
                maxLength={40}
                autoComplete="name"
                placeholder="Eray Çocuk"
                className={input}
              />
            </label>
          )}
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">E-posta Adresi</span>
            <input name="email" type="email" required autoComplete="email" placeholder="ornek@qadro.com" className={input} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Şifre</span>
            <span className="relative block">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={isRegister ? 8 : 1}
                autoComplete={isRegister ? "new-password" : "current-password"}
                placeholder={isRegister ? "En az 8 karakter" : "••••••••"}
                className={`${input} pr-12`}
              />
              <button
                type="button"
                aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-muted"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>

          {errors.length > 0 && (
            <ul role="alert" className="space-y-1 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-primary py-3.5 font-semibold text-on-primary shadow-lg shadow-primary/30 disabled:opacity-50"
          >
            {pending ? "Bekle..." : isRegister ? "Kayıt Ol" : "Giriş Yap"}
          </button>
        </form>

        <div className="my-8 flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-line" /> veya <span className="h-px flex-1 bg-line" />
        </div>

        <button
          type="button"
          disabled={pending}
          onClick={() => send("/api/auth/demo")}
          className="flex items-center justify-center gap-2 rounded-xl border border-line bg-surface py-3 text-sm font-semibold disabled:opacity-50"
        >
          <Sparkles size={16} className="text-primary" /> Demo hesabıyla dene
        </button>
        <Link href="/demo" className="mt-3 text-center text-sm font-semibold text-primary">
          Rehberli oyunlaştırma turunu başlat →
        </Link>

        <p className="mt-auto pt-10 text-center text-sm text-muted">
          {isRegister ? "Zaten hesabın var mı? " : "Henüz hesabın yok mu? "}
          <Link href={isRegister ? "/giris" : "/kayit"} className="font-semibold text-primary">
            {isRegister ? "Giriş Yap" : "Kayıt Ol"}
          </Link>
        </p>
      </main>
    </AuthShell>
  );
}
