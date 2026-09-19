import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { COOKIE_NAME, JWT_SECRET, type SessionPayload } from "@/lib/sessionConfig";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect legacy /admin/login to /staff/login
  if (pathname === "/admin/login") {
    return NextResponse.redirect(new URL("/staff/login", request.url));
  }

  // Protect /admin routes
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token) {
      const loginUrl = new URL("/staff/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const session = payload as unknown as SessionPayload;

      if (session.role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/staff/login?error=unauthorized", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/staff/login?error=expired", request.url));
    }
  }

  // Auto-redirect already logged-in users away from /staff/login
  if (pathname === "/staff/login" && !request.nextUrl.searchParams.has("error")) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const session = payload as unknown as SessionPayload;

        if (session.role === "SUPER_ADMIN") {
          return NextResponse.redirect(new URL("/admin/dashboard", request.url));
        } else if (session.role === "STAFF") {
          return NextResponse.redirect(new URL("/staff/dashboard", request.url));
        }
      } catch {
        // Invalid or expired token - let them proceed to login page
      }
    }
  }

  // Protect /staff routes
  if (pathname.startsWith("/staff") && pathname !== "/staff/login") {
    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token) {
      const loginUrl = new URL("/staff/login", request.url);
      if (pathname !== "/staff") {
        loginUrl.searchParams.set("from", pathname);
      }
      return NextResponse.redirect(loginUrl);
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const session = payload as unknown as SessionPayload;

      if (session.role !== "STAFF" && session.role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/staff/login?error=unauthorized", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/staff/login?error=expired", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/staff/:path*",
  ],
};
