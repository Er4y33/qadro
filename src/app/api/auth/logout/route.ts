import { NextResponse } from "next/server";
import { endSession } from "@/lib/auth";

/** POST /api/auth/logout → 204 No Content, oturum ve çerez silinir */
export async function POST() {
  await endSession();
  return new NextResponse(null, { status: 204 });
}

/**
 * GET /api/auth/logout → çerezi silip giriş ekranına yönlendirir (307).
 * Süresi dolmuş ya da geçersiz bir çerezle gelen kullanıcı için kullanılır;
 * aksi halde "çerez var ama oturum yok" durumu yönlendirme döngüsüne yol açardı.
 */
export async function GET(request: Request) {
  await endSession();
  return NextResponse.redirect(new URL("/giris", request.url));
}
