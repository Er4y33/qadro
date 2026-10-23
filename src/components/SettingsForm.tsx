"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Info, KeyRound, Palette, Trash2, UserRound } from "lucide-react";
import { LogoutButton } from "./LogoutButton";
import { ThemeToggle } from "./ThemeToggle";

const input =
  "w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-fg outline-none placeholder:text-muted focus:border-primary";

type Status = { tone: "ok" | "error"; text: string } | null;

/** Ayarlar: ad, şifre, tema, çıkış ve hesabı silme. Her bölüm kendi REST isteğini gönderir. */
export function SettingsForm({ name, email }: { name: string; email: string | null }) {
  const router = useRouter();
  const demo = !email;
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [pending, startTransition] = useTransition();

  const call = (key: string, url: string, method: string, body: object, okText: string, after?: () => void) =>
    startTransition(async () => {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) {
        setStatus((s) => ({ ...s, [key]: { tone: "ok", text: okText } }));
        after?.();
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus((s) => ({ ...s, [key]: { tone: "error", text: data.error ?? "İşlem başarısız." } }));
      }
    });

  return (
    <div className="space-y-5 px-5">
      {demo && (
        <p className="flex gap-2 rounded-2xl border border-info/40 bg-info/10 p-3 text-xs">
          <Info size={16} className="shrink-0 text-info" />
          Demo hesabındasın. Ad, şifre ve hesap ayarları herkesin kullandığı bu hesap için kapalı; kendi hesabını açarak deneyebilirsin.
        </p>
      )}

      <Section icon={UserRound} title="Profil">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const value = new FormData(e.currentTarget).get("name");
            call("name", "/api/auth/me", "PATCH", { name: value }, "Adın güncellendi.", () => router.refresh());
          }}
          className="space-y-3"
        >
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-muted">Ad Soyad</span>
            <input name="name" defaultValue={name} required minLength={2} maxLength={40} disabled={demo} className={input} />
          </label>
          {email && <p className="text-xs text-muted">E-posta: {email}</p>}
          <Submit disabled={demo || pending}>Kaydet</Submit>
          <Message status={status.name} />
        </form>
      </Section>

      <Section icon={KeyRound} title="Şifre">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const data = new FormData(form);
            call(
              "password",
              "/api/auth/password",
              "POST",
              { current: data.get("current"), next: data.get("next") },
              "Şifren değişti. Diğer cihazlardaki oturumların kapatıldı.",
              () => form.reset(),
            );
          }}
          className="space-y-3"
        >
          <input name="current" type="password" autoComplete="current-password" placeholder="Mevcut şifre" required disabled={demo} className={input} />
          <input name="next" type="password" autoComplete="new-password" placeholder="Yeni şifre (en az 8 karakter)" minLength={8} required disabled={demo} className={input} />
          <Submit disabled={demo || pending}>Şifreyi Değiştir</Submit>
          <Message status={status.password} />
        </form>
      </Section>

      <Section icon={Palette} title="Görünüm">
        <div className="flex items-center justify-between">
          <p className="text-sm">Açık / koyu tema</p>
          <ThemeToggle />
        </div>
      </Section>

      <LogoutButton />

      <Section icon={Trash2} title="Hesabı Sil" danger>
        <p className="text-xs text-muted">
          Adın &quot;Silinmiş Oyuncu&quot; olarak değişir, e-posta ve şifren silinir, gelecekteki maçlardan çıkarılırsın. Oynanmış maçlardaki
          kaydın takım arkadaşlarının istatistikleri bozulmasın diye anonim olarak kalır. Bu işlem geri alınamaz.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const password = new FormData(e.currentTarget).get("password");
            if (!window.confirm("Hesabın kalıcı olarak silinecek. Emin misin?")) return;
            call("delete", "/api/auth/me", "DELETE", { password }, "Hesabın silindi.", () => {
              router.push("/hosgeldin");
              router.refresh();
            });
          }}
          className="mt-3 space-y-3"
        >
          <input name="password" type="password" autoComplete="current-password" placeholder="Onay için şifren" required disabled={demo} className={input} />
          <button
            type="submit"
            disabled={demo || pending}
            className="w-full rounded-xl border border-danger/50 bg-danger/10 py-3 text-sm font-semibold text-danger disabled:opacity-40"
          >
            Hesabımı Sil
          </button>
          <Message status={status.delete} />
        </form>
      </Section>
    </div>
  );
}

function Section({ icon: Icon, title, danger, children }: { icon: typeof Info; title: string; danger?: boolean; children: React.ReactNode }) {
  return (
    <section className={`rounded-2xl border bg-surface p-4 ${danger ? "border-danger/30" : "border-line"}`}>
      <h2 className={`mb-3 flex items-center gap-2 text-sm font-bold ${danger ? "text-danger" : ""}`}>
        <Icon size={16} /> {title}
      </h2>
      {children}
    </section>
  );
}

function Submit({ disabled, children }: { disabled: boolean; children: React.ReactNode }) {
  return (
    <button type="submit" disabled={disabled} className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-on-primary disabled:opacity-40">
      {children}
    </button>
  );
}

function Message({ status }: { status: Status | undefined }) {
  if (!status) return null;
  return (
    <p role="status" className={`text-xs font-semibold ${status.tone === "ok" ? "text-success" : "text-danger"}`}>
      {status.text}
    </p>
  );
}
