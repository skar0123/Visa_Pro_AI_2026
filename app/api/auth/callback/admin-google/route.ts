import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { buildIntermediateToken } from "@/lib/admin-auth";

function secret(): string {
  return process.env.SESSION_SECRET || "visapro-default-secret-replace-in-prod";
}

function verifyState(state: string): boolean {
  try {
    const dot = state.lastIndexOf(".");
    if (dot < 1) return false;
    const encoded  = state.slice(0, dot);
    const sig      = state.slice(dot + 1);
    const expected = createHmac("sha256", secret()).update(encoded).digest("base64url");
    return sig === expected;
  } catch {
    return false;
  }
}

const clearStateCookie = "admin_oauth_state=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code  = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const origin = `${req.nextUrl.protocol}//${req.nextUrl.host}`;

  function fail(reason: string) {
    const res = NextResponse.redirect(`${origin}/admin-login?error=${reason}`);
    res.headers.set("Set-Cookie", clearStateCookie);
    return res;
  }

  if (error || !code || !state) return fail("oauth_failed");

  // CSRF: state cookie must match URL state
  const cookieHeader = req.headers.get("cookie") ?? "";
  const cookieState  = cookieHeader.match(/admin_oauth_state=([^;]+)/)?.[1];
  if (!cookieState || decodeURIComponent(cookieState) !== state) return fail("state_mismatch");

  if (!verifyState(state)) return fail("invalid_state");

  const clientId     = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return fail("oauth_not_configured");

  // Exchange auth code for access token
  let access_token: string;
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id:     clientId,
        client_secret: clientSecret,
        redirect_uri:  `${origin}/api/auth/callback/admin-google`,
        grant_type:    "authorization_code",
      }),
    });
    if (!tokenRes.ok) throw new Error("token_failed");
    const tokens = await tokenRes.json();
    access_token = tokens.access_token;
  } catch {
    return fail("token_failed");
  }

  // Fetch verified email from Google
  let email: string;
  try {
    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!userRes.ok) throw new Error("user_info_failed");
    const info = await userRes.json();
    email = (info.email as string) ?? "";
  } catch {
    return fail("user_info_failed");
  }

  // Authorisation check: must match ADMIN_EMAIL exactly (case-insensitive)
  const adminEmail = (process.env.ADMIN_EMAIL ?? "").toLowerCase().trim();
  if (!adminEmail || email.toLowerCase().trim() !== adminEmail) return fail("not_authorized");

  // Identity confirmed — issue intermediate token; password step still required
  const token = buildIntermediateToken(email);
  const res   = NextResponse.redirect(
    `${origin}/admin-login?step=password&token=${encodeURIComponent(token)}`
  );
  res.headers.set("Set-Cookie", clearStateCookie);
  return res;
}
