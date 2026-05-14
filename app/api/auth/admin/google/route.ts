import { NextRequest, NextResponse } from "next/server";
import { createHmac, randomBytes } from "crypto";

function secret(): string {
  return process.env.SESSION_SECRET || "visapro-default-secret-replace-in-prod";
}

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL("/admin-login?error=oauth_not_configured", req.url));
  }

  const nonce     = randomBytes(16).toString("hex");
  const encoded   = Buffer.from(JSON.stringify({ nonce })).toString("base64url");
  const sig       = createHmac("sha256", secret()).update(encoded).digest("base64url");
  const state     = `${encoded}.${sig}`;

  const origin      = `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  const callbackUrl = `${origin}/api/auth/callback/admin-google`;

  const googleUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleUrl.searchParams.set("client_id",     clientId);
  googleUrl.searchParams.set("redirect_uri",  callbackUrl);
  googleUrl.searchParams.set("response_type", "code");
  googleUrl.searchParams.set("scope",         "openid email profile");
  googleUrl.searchParams.set("state",         state);
  googleUrl.searchParams.set("access_type",   "online");
  googleUrl.searchParams.set("prompt",        "select_account");

  const isProd = process.env.NODE_ENV === "production";
  const res = NextResponse.redirect(googleUrl.toString());
  res.headers.set("Set-Cookie", [
    `admin_oauth_state=${encodeURIComponent(state)}`,
    "HttpOnly",
    "Path=/",
    "Max-Age=600",
    "SameSite=Lax",
    ...(isProd ? ["Secure"] : []),
  ].join("; "));

  return res;
}
