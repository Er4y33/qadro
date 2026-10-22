import { NextResponse, type NextRequest } from "next/server";

/**
 * Giriş yapmamış ziyaretçiyi tanıtım ekranına yönlendirir.
 * Burada yalnızca çerezin VAR olup olmadığına bakılır (hızlı, veritabanına gitmez).
 * Çerezin gerçekten geçerli olup olmadığını sayfalar ve API sunucuda kontrol eder.
 */
const PUBLIC_PATHS = ["/hosgeldin", "/giris", "/kayit", "/saha", "/demo"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const hasSession = request.cookies.has("qadro_session");

  if (!hasSession && !isPublic) {
    return NextResponse.redirect(new URL("/hosgeldin", request.url)); // 307 Temporary Redirect
  }
  if (hasSession && (pathname === "/giris" || pathname === "/kayit")) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // API rotaları kendi 401 yanıtını verir; statik dosyalar ve ikonlar hariç tutulur.
  matcher: ["/((?!api|_next/static|_next/image|icons|favicon.ico|apple-icon.png|manifest.webmanifest).*)"],
};
