import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookies      = request.headers.get("cookie") || "";

  // ── Admin routes → require admin cookie ──────────────────────────────────
  if (pathname.startsWith("/admin") && pathname !== "/admin-login") {
    const hasAdmin = /visapro_admin=/.test(cookies);
    if (!hasAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin-login";
      url.search   = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // ── Dashboard / Results → require user session ───────────────────────────
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/results")) {
    const hasSession = /visapro_session=/.test(cookies);
    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search   = "";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/results/:path*", "/admin/:path*", "/admin"],
};
