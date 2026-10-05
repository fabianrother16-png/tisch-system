import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, passwordConfigured, safeEqual, sessionToken } from "./lib/auth";

// Öffentlich: Login und die Freigabe-Seiten für Kunden (per geheimem Link).
const PUBLIC = [/^\/login$/, /^\/api\/login$/, /^\/freigabe\//, /^\/api\/freigabe\//];

export async function proxy(request: NextRequest) {
  if (!passwordConfigured()) return NextResponse.next();
  const { pathname, search } = request.nextUrl;
  if (PUBLIC.some((re) => re.test(pathname))) return NextResponse.next();

  const cookie = request.cookies.get(SESSION_COOKIE)?.value ?? "";
  if (cookie && safeEqual(cookie, await sessionToken())) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }
  const login = new URL("/login", request.url);
  login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|robots.txt).*)"],
};
