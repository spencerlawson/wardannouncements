import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Edge-compatible middleware — no DB imports allowed here.
// Real auth verification (including super admin check) happens in each layout/page.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ??
    request.cookies.get("__Secure-authjs.session-token")?.value;

  const isLoggedIn = !!sessionToken;

  if ((pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login"],
};
