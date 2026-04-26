import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    !pathname.startsWith("/dashboard") &&
    !pathname.startsWith("/results")
  ) {
    return NextResponse.next();
  }

  const cookies = request.headers.get("cookie") || "";
  const hasSession = /visapro_session=/.test(cookies);

  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/pricing";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/results/:path*"],
};
