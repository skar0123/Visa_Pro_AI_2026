import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { getOrCreateUser } from "@/lib/db/users";
import { createSession, buildSessionCookie } from "@/lib/services/session";

function secret(): string {
  return process.env.SESSION_SECRET || "visapro-default-secret-replace-in-prod";
}

function verifyState(state: string): { plan: string; returnTo: string } | null {
  try {
    const dot      = state.lastIndexOf(".");
    if (dot < 1) return null;
    const encoded  = state.slice(0, dot);
    const sig      = state.slice(dot + 1);
    const expected = createHmac("sha256", secret()).update(encoded).digest("base64url");
    if (sig !== expected) return null;
    const parsed   = JSON.parse(Buffer.from(encoded, "base64url").toString());
    return { plan: parsed.plan ?? "free", returnTo: parsed.returnTo ?? "/dashboard" };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code  = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const origin = `${req.nextUrl.protocol}//${req.nextUrl.host}`;

  if (error || !code || !state) {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }

  // Verify state matches cookie
  const cookieHeader = req.headers.get("cookie") ?? "";
  const cookieState  = cookieHeader.match(/oauth_state=([^;]+)/)?.[1];
  if (!cookieState || decodeURIComponent(cookieState) !== state) {
    return NextResponse.redirect(`${origin}/login?error=state_mismatch`);
  }

  const statePayload = verifyState(state);
  if (!statePayload) {
    return NextResponse.redirect(`${origin}/login?error=invalid_state`);
  }

  const { plan, returnTo } = statePayload;

  // Exchange code for tokens
  const clientId     = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/login?error=oauth_not_configured`);
  }

  let googleTokens: { access_token: string };
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id:     clientId,
        client_secret: clientSecret,
        redirect_uri:  `${origin}/api/auth/callback/google`,
        grant_type:    "authorization_code",
      }),
    });
    if (!tokenRes.ok) throw new Error(`Token exchange failed: ${tokenRes.status}`);
    googleTokens = await tokenRes.json();
  } catch (err) {
    console.error("[google-callback] token exchange:", err);
    return NextResponse.redirect(`${origin}/login?error=token_failed`);
  }

  // Get user info
  let googleUser: { email: string; name?: string; sub: string };
  try {
    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${googleTokens.access_token}` },
    });
    if (!userRes.ok) throw new Error("User info fetch failed");
    googleUser = await userRes.json();
  } catch (err) {
    console.error("[google-callback] user info:", err);
    return NextResponse.redirect(`${origin}/login?error=user_info_failed`);
  }

  const { email, name } = googleUser;

  // Create / update user in DB (async in v7 layer)
  const user    = await getOrCreateUser(email, name);
  const isPaid  = user.plan === "pro" || user.plan === "premium";
  const token   = createSession(email, isPaid, undefined, name);

  // Clear oauth_state cookie
  const clearStateCookie = "oauth_state=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax";

  // Redirect paid-plan users to pricing so they can complete checkout via Razorpay
  const dest = (plan === "pro" || plan === "premium")
    ? `${origin}/pricing?plan=${plan}`
    : returnTo.startsWith("/") ? `${origin}${returnTo}` : `${origin}/dashboard`;
  const res  = NextResponse.redirect(dest);
  res.headers.append("Set-Cookie", buildSessionCookie(token));
  res.headers.append("Set-Cookie", clearStateCookie);
  return res;
}
