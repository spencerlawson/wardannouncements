import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isSuperAdmin = req.auth?.user?.isSuperAdmin ?? false;

  if (nextUrl.pathname.startsWith("/admin")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", nextUrl));
    if (!isSuperAdmin) return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (nextUrl.pathname.startsWith("/dashboard") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (nextUrl.pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login"],
};
