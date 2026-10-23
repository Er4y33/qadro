import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { levelFromXp } from "@/lib/gamification";
import { getPlayer, getProfile } from "@/lib/players";

/*
 * Paylaşım önizleme görseli (Open Graph): Bağlantı WhatsApp, X ya da Discord'a yapıştırıldığında görünen kart.
 * Sunucuda JSX'ten PNG üretilir (next/og). Türkçe harfler (ş, ğ, ı) için Inter yazı tipi projeyle birlikte gelir
 * (assets/fonts, OFL lisanslı, yalnızca Latin harfleriyle küçültülmüş).
 */
export const alt = "Qadro oyuncu kartı";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const [bold, regular] = await Promise.all([
    readFile(join(process.cwd(), "assets/fonts/Inter-Bold.otf")),
    readFile(join(process.cwd(), "assets/fonts/Inter-Regular.otf")),
  ]);
  const player = await getPlayer((await params).id);
  const profile = player ? await getProfile(player) : null;
  const level = profile ? levelFromXp(profile.totalXp).level : 1;
  const stats: [string, string][] = profile
    ? [
        [String(profile.stats.matchesPlayed), "Onaylı maç"],
        [profile.reliability.toFixed(1), "Güvenilirlik"],
        [String(profile.mvpAwards), "MVP ödülü"],
      ]
    : [];

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#0b1220", color: "#f1f5f9", fontFamily: "Inter" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 36, fontWeight: 700, color: "#00e676" }}>QADRO</div>
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <div style={{ width: 168, height: 168, borderRadius: 84, background: "#00e676", color: "#0b1220", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64, fontWeight: 700 }}>
            {player?.initials ?? "?"}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 72, fontWeight: 700 }}>{player?.name ?? "Oyuncu bulunamadı"}</div>
            <div style={{ fontSize: 34, color: "#94a3b8" }}>{profile ? `Seviye ${level} · ${profile.role} · Kahramanmaraş` : ""}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {stats.map(([value, label]) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", flex: 1, padding: "24px 32px", borderRadius: 24, background: "#151f33" }}>
              <div style={{ fontSize: 56, fontWeight: 700 }}>{value}</div>
              <div style={{ fontSize: 28, color: "#94a3b8" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter", data: bold, weight: 700, style: "normal" },
        { name: "Inter", data: regular, weight: 400, style: "normal" },
      ],
    },
  );
}
