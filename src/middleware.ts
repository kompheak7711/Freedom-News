import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";
import { LOCALE_COOKIE, routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

/**
 * Adds the locale prefix (/en, /km) and remembers the choice in a cookie.
 * First visits are detected from Accept-Language, except that visitors in
 * Cambodia (Vercel's x-vercel-ip-country header) default to Khmer.
 * The matcher keeps /api (including /api/cron/refresh) and static files out.
 */
export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasPrefix = routing.locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  const hasChoice = request.cookies.has(LOCALE_COOKIE);
  const country = request.headers.get("x-vercel-ip-country")?.toUpperCase();
  if (!hasPrefix && !hasChoice && country === "KH") {
    const headers = new Headers(request.headers);
    headers.set("accept-language", "km");
    return intlMiddleware(new NextRequest(request.url, { headers }));
  }
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
