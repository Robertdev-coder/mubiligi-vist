import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/admin", "/dean"];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!isProtected) return NextResponse.next();

  const cookies = request.cookies.getAll();
  const hasLocalSession = cookies.some((cookie) => cookie.name === "mvd_session");
  const hasSupabaseSession = cookies.some((cookie) => cookie.name.includes("-auth-token"));

  if (!hasLocalSession && !hasSupabaseSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dean/:path*"],
};
