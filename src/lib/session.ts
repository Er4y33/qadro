import "server-only";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { getViewer, type Viewer } from "./auth";

/** Sayfalar için: giriş yapılmamışsa (ya da oturum süresi dolmuşsa) giriş ekranına yönlendirir. */
export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/api/auth/logout"); // geçersiz çerezi temizleyip girişe gönderir
  return viewer;
}

/** API rotaları için standart 401 yanıtı */
export const unauthorized = () => NextResponse.json({ error: "Bu işlem için giriş yapmalısın." }, { status: 401 });
