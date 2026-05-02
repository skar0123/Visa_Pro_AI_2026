import { NextRequest, NextResponse } from "next/server";
import { createHmac, randomBytes } from "crypto";

function secret(): string {
  return process.env.SESSION_SECRET || "visapro-default-secret-replace-in-prod";
}

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Google OAuth not configured." }, { status: 500 });
  }

  const { searchParams } = req.nextUrl;
  const plan     = searchParams.get("plan") ?? "free";
  const returnTo = searchParams.get("returnTo") ?? "/dashboard";

  // Build signed state: base64url(stateData).sig
  const nonce     = randomBytes(16).toString("hex");
  const stateData = JSON.stringify({ nonce, plan, returnTo });
  const encoded   = Buffer.from(stateData).toString("base64url");
  const sig       = createHmac("sha256", secret()).update(encoded).digest("base64url");
  const state     = `${encoded}.${sig}`;

  const origin =
    req.headers.get("origin") ||
    `${req.nextUrl.protocol}//${req.nextUrl.host}`;

  const callbackUrl = `${origin}/api/auth/callback/google`;

  const googleUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleUrl.searchParams.set("client_id",     clientId);
  googleUrl.searchParams.set("redirect_uri",  callbackUrl);
  googleUrl.searchParams.set("response_type", "code");
  googleUrl.searchParams.set("scope",         "openid email profile");
  googleUrl.searchParams.set("state",         state);
  googleUrl.searchParams.set("access_type",   "online");
  googleUrl.searchParams.set("prompt",        "select_account");

  const res = NextResponse.redirect(googleUrl.toString());
  // Store state in cookie for CSRF protection
  const isProd = process.env.NODE_ENV === "production";
  res.headers.set(
    "Set-Cookie",
    [
      `oauth_state=${encodeURIComponent(state)}`,
      "HttpOnly",
      "Path=/",
      "Max-Age=600",
      "SameSite=Lax",
      ...(isProd ? ["Secure"] : []),
    ].join("; ")
  );
  return res;
}
