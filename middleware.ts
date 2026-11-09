import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PORTALS = ["/app", "/lab", "/merchant", "/provider", "/admin", "/desk"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const gated = PORTALS.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (gated && !request.cookies.get("ds_actor")?.value) {
    const url = request.nextUrl.clone();
    url.pathname = "/enter";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  const response = NextResponse.next();
  if (gated || pathname.startsWith("/api/")) {
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("Referrer-Policy", "same-origin");
  }
  return response;
}

export const config = {
  matcher: ["/app/:path*", "/lab/:path*", "/merchant/:path*", "/provider/:path*", "/admin/:path*", "/desk/:path*", "/api/:path*"],
};
