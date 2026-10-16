"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Check, ChevronLeft, Clock, Globe, Lock, MapPin, PartyPopper, Users, X } from "lucide-react";
import { SPORT_LABELS, type Sport, type Venue } from "@/lib/types";
import { FORMATS, SPORT_EMOJI } from "@/lib/sports";
import { cn } from "./ui";

const TIMES = ["18:00", "19:00", "20:00", "21:00", "22:00", "23:00"];
const STEPS = ["Branş ve Format", "Zaman ve Konum", "Kurallar ve Onay"];

interface DayOption {
  iso: string;
  weekday: string;
  day: number;
}

/** Bugünden itibaren 7 gün. Tarih tarayıcıda hesaplanır; sunucu ile saat farkı hidrasyon hatası yaratmasın diye useEffect içinde. */
function nextDays(count: number): DayOption[] {
  const fmt = new Intl.DateTimeFormat("tr-TR", { weekday: "short" });
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      // toISOString UTC'ye çevirir; Türkiye'de gece 00–03 arası bir önceki günü verirdi. Yerel tarih kullanılıyor.
      iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      weekday: i === 0 ? "Bugün" : i === 1 ? "Yarın" : fmt.format(d),
      day: d.getDate(),
    };
  });
}

/** Seçilen gün ve saati Türkiye saatiyle ISO tarihe çevirir (Türkiye yaz saati uygulamaz, hep UTC+3) */
const toIso = (date: string, time: string) => `${date}T${time}:00+03:00`;

/** Otomatik başlık önerisi: "Cumartesi Akşamı Tenis" */
function suggestTitle(day: DayOption | undefined, time: string | null, sport: Sport) {
  const hour = time ? Number(time.slice(0, 2)) : 20;
  const part = hour < 12 ? "Sabahı" : hour < 17 ? "Öğleden Sonra" : "Akşamı";
  const weekday = day ? new Intl.DateTimeFormat("tr-TR", { weekday: "long" }).format(new Date(`${day.iso}T12:00:00`)) : "";
  return `${weekday} ${part} ${SPORT_LABELS[sport]}`.trim();
}

export function CreateMatchWizard({ venues, organizedBefore }: { venues: Venue[]; organizedBefore: number }) {
  const [step, setStep] = useState(0);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");

  const [sport, setSport] = useState<Sport>("futbol");
  const [format, setFormat] = useState(FORMATS.futbol[2].label);
  const [days, setDays] = useState<DayOption[]>([]);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [venueId, setVenueId] = useState<string | null>(null);
  const [price, setPrice] = useState(120);
  const [minLevel, setMinLevel] = useState(5);
  const [isPublic, setIsPublic] = useState(true);
  const [note, setNote] = useState("");

  useEffect(() => {
    const d = nextDays(7);
    setDays(d);
    setDate(d[0].iso);
  }, []);

  const sportVenues = venues.filter((v) => v.sports.includes(sport));
  const venue = venues.find((v) => v.id === venueId);
  const players = FORMATS[sport].find((f) => f.label === format)?.players ?? 0;
  const day = days.find((d) => d.iso === date);

  const pickSport = (s: Sport) => {
    setSport(s);
    setFormat(FORMATS[s][0].label);
    setVenueId(null);
    setTitle("");
  };

  /** Bugün seçiliyse geçmiş saatler seçilemez */
  const isPast = (t: string) => Boolean(date && new Date(toIso(date, t)).getTime() < Date.now());

  const canContinue = [true, Boolean(date && time && venue && !isPast(time)), title.trim().length >= 3 && price >= 0 && minLevel >= 1][step];

  const publish = () =>
    startTransition(async () => {
      setErrors([]);
      // REST API: başarılıysa 201 Created ve yeni maçın kimliği döner
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, sport, format, venueId, startsAt: toIso(date!, time!), price, minLevel, isPublic, note }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.status === 201) setCreatedId(body.id);
      else setErrors(body.errors ?? [body.error ?? "Maç oluşturulamadı."]);
    });

  const next = () => {
    if (step === 1 && !title) setTitle(suggestTitle(day, time, sport));
    if (step < STEPS.length - 1) return setStep(step + 1);
    publish();
  };

  if (createdId && venue && day && time) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 text-primary">
          <PartyPopper size={36} />
        </span>
        <h1 className="mt-5 text-2xl font-bold">Maç Yayında!</h1>
        <p className="mt-2 text-sm text-muted">
          {isPublic ? "İlanın Keşfet'e düştü. Yakındaki oyuncular bildirim alacak." : "Gizli maç oluşturuldu. Bağlantıyı paylaşarak oyuncu davet et."}
        </p>

        <div className="mt-6 w-full rounded-2xl border border-line bg-surface p-4 text-left text-sm">
          <p className="font-bold">
            {SPORT_EMOJI[sport]} {SPORT_LABELS[sport]} • {format}
          </p>
          <p className="mt-1 text-muted">
            {day.weekday} {day.day}, {time} • {venue.name}
          </p>
          <p className="mt-3 text-xs font-semibold text-primary">
            Organize ettiğin {organizedBefore + 1}. maç. Maç dolduğunda kadroyu onaylamayı unutma!
          </p>
        </div>

        <Link
          href={`/mac/${createdId}`}
          className="mt-8 w-full rounded-xl bg-primary py-3.5 font-bold text-on-primary shadow-lg shadow-primary/30"
        >
          Maça Git
        </Link>
        <Link href="/" className="mt-3 text-sm font-semibold text-muted">
          Ana Sayfaya Dön
        </Link>
      </main>
    );
  }

  return (
    <main className="flex-1 pb-32">
      <header className="grid grid-cols-[40px_1fr_40px] items-center px-4 pt-5 pb-3">
        {step === 0 ? (
          <Link href="/" aria-label="Kapat" className="flex h-10 w-10 items-center justify-center">
            <X size={22} />
          </Link>
        ) : (
          <button type="button" aria-label="Geri" onClick={() => setStep(step - 1)} className="flex h-10 w-10 items-center justify-center">
            <ChevronLeft size={24} />
          </button>
        )}
        <div className="text-center">
          <h1 className="font-semibold">Maç Oluştur</h1>
          <p className="text-xs text-muted">
            Adım {step + 1}/{STEPS.length}: {STEPS[step]}
          </p>
        </div>
      </header>

      <div className="mx-5 grid grid-cols-3 gap-1.5" aria-hidden>
        {STEPS.map((s, i) => (
          <div key={s} className={cn("h-1 rounded-full transition", i <= step ? "bg-primary" : "bg-surface-2")} />
        ))}
      </div>

      <div className="space-y-7 px-5 pt-6">
        {step === 0 && (
          <>
            <section>
              <h2 className="mb-3 font-bold">Hangi branş?</h2>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(SPORT_LABELS) as Sport[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={sport === s}
                    onClick={() => pickSport(s)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-2xl border py-5 font-semibold transition",
                      sport === s ? "border-primary bg-primary/10 text-primary" : "border-line bg-surface text-fg",
                    )}
                  >
                    <span className="text-3xl">{SPORT_EMOJI[s]}</span>
                    {SPORT_LABELS[s]}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-3 font-bold">Format</h2>
              <div className="flex flex-wrap gap-2">
                {FORMATS[sport].map((f) => (
                  <button
                    key={f.label}
                    type="button"
                    aria-pressed={format === f.label}
                    onClick={() => setFormat(f.label)}
                    className={cn(
                      "rounded-full border px-5 py-2 text-sm font-semibold transition",
                      format === f.label ? "border-primary bg-primary text-on-primary" : "border-line bg-surface",
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-sm text-muted">
                <Users size={16} /> Toplam <strong className="text-fg">{players} oyuncu</strong> gerekiyor
              </p>
            </section>
          </>
        )}

        {step === 1 && (
          <>
            <section>
              <h2 className="mb-3 font-bold">Gün</h2>
              <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {days.map((d) => (
                  <button
                    key={d.iso}
                    type="button"
                    aria-pressed={date === d.iso}
                    onClick={() => setDate(d.iso)}
                    className={cn(
                      "flex w-16 shrink-0 flex-col items-center rounded-2xl border py-2.5 transition",
                      date === d.iso ? "border-primary bg-primary text-on-primary" : "border-line bg-surface",
                    )}
                  >
                    <span className="text-[11px] font-medium opacity-80">{d.weekday}</span>
                    <span className="text-lg font-bold">{d.day}</span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-3 font-bold">Saat</h2>
              <div className="grid grid-cols-3 gap-2">
                {TIMES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={time === t}
                    disabled={isPast(t)}
                    onClick={() => setTime(t)}
                    className={cn(
                      "flex items-center justify-center gap-1 rounded-xl border py-2.5 text-sm font-semibold transition disabled:opacity-30",
                      time === t ? "border-primary bg-primary text-on-primary" : "border-line bg-surface",
                    )}
                  >
                    <Clock size={14} /> {t}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-3 font-bold">Saha</h2>
              <ul className="space-y-2">
                {sportVenues.map((v) => (
                  <li key={v.id}>
                    <button
                      type="button"
                      aria-pressed={venueId === v.id}
                      onClick={() => setVenueId(v.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition",
                        venueId === v.id ? "border-primary bg-primary/10" : "border-line bg-surface",
                      )}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-primary">
                        <MapPin size={20} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{v.name}</span>
                        <span className="block text-xs text-muted">
                          {v.distanceKm} km • {v.driveMinutes} dk • {v.amenities[0]}
                        </span>
                      </span>
                      {venueId === v.id && <Check size={20} className="text-primary" />}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        {step === 2 && (
          <>
            <label className="block rounded-xl border border-line bg-surface px-3 py-2">
              <span className="block text-[11px] text-muted">Maç Başlığı</span>
              <input
                value={title}
                maxLength={60}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent font-semibold outline-none"
              />
            </label>

            <section className="grid grid-cols-2 gap-3">
              <label className="rounded-xl border border-line bg-surface px-3 py-2">
                <span className="block text-[11px] text-muted">Kişi Başı Ücret</span>
                <span className="flex items-center font-semibold text-success">
                  ₺
                  <input
                    type="number"
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-transparent outline-none"
                  />
                </span>
              </label>
              <label className="rounded-xl border border-line bg-surface px-3 py-2">
                <span className="block text-[11px] text-muted">Minimum Seviye</span>
                <span className="flex items-center font-semibold text-warning">
                  Lvl.
                  <input
                    type="number"
                    min={1}
                    value={minLevel}
                    onChange={(e) => setMinLevel(Number(e.target.value))}
                    className="ml-1 w-full bg-transparent outline-none"
                  />
                </span>
              </label>
            </section>

            <section>
              <h2 className="mb-3 font-bold">Kimler görebilir?</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: true, icon: Globe, title: "Herkese Açık", hint: "Keşfet'e düşer" },
                  { value: false, icon: Lock, title: "Gizli", hint: "Sadece davetle" },
                ].map(({ value, icon: Icon, title, hint }) => (
                  <button
                    key={title}
                    type="button"
                    aria-pressed={isPublic === value}
                    onClick={() => setIsPublic(value)}
                    className={cn(
                      "rounded-2xl border p-3 text-left transition",
                      isPublic === value ? "border-primary bg-primary/10" : "border-line bg-surface",
                    )}
                  >
                    <Icon size={18} className={isPublic === value ? "text-primary" : "text-muted"} />
                    <p className="mt-2 text-sm font-semibold">{title}</p>
                    <p className="text-xs text-muted">{hint}</p>
                  </button>
                ))}
              </div>
            </section>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Ekstra bir not ekle... (Örn: Kaleci aranıyor)"
              className="w-full resize-none rounded-xl border border-line bg-surface px-3 py-3 text-sm outline-none focus:border-primary"
            />

            <section className="rounded-2xl border border-line bg-surface p-4 text-sm">
              <h2 className="mb-2 font-bold">Özet</h2>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                <dt className="text-muted">Branş</dt>
                <dd className="text-right font-semibold">
                  {SPORT_EMOJI[sport]} {SPORT_LABELS[sport]} • {format}
                </dd>
                <dt className="text-muted">Zaman</dt>
                <dd className="text-right font-semibold">
                  {day?.weekday} {day?.day}, {time}
                </dd>
                <dt className="text-muted">Saha</dt>
                <dd className="truncate text-right font-semibold">{venue?.name}</dd>
                <dt className="text-muted">Kadro</dt>
                <dd className="text-right font-semibold">1 / {players} (sen dahil)</dd>
              </dl>
            </section>
          </>
        )}
      </div>

      <div className="fixed bottom-0 left-1/2 w-full max-w-[430px] -translate-x-1/2 lg:left-[calc(50%+8rem)] lg:max-w-[520px] border-t border-line bg-bg/95 px-5 pt-3 pb-6 backdrop-blur">
        {errors.length > 0 && (
          <ul className="mb-2 space-y-0.5 text-center text-xs font-semibold text-danger">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
        <button
          type="button"
          disabled={!canContinue || pending}
          onClick={next}
          className="w-full rounded-xl bg-primary py-3.5 font-semibold text-on-primary shadow-lg shadow-primary/30 transition disabled:opacity-40 disabled:shadow-none"
        >
          {step < STEPS.length - 1 ? `Devam Et (${STEPS[step + 1]})` : pending ? "Yayınlanıyor..." : "Maçı Yayınla"}
        </button>
      </div>
    </main>
  );
}
