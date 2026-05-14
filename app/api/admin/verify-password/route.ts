import { NextRequest, NextResponse } from "next/server";
import { verifyIntermediateToken, buildAdminToken, buildAdminCookie } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  let password: string, token: string;
  try {
    const body = await req.json();
    password = (body.password as string) ?? "";
    token    = (body.token    as string) ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!password || !token) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  // Verify intermediate token (proves Google OAuth succeeded for ADMIN_EMAIL)
  const payload = verifyIntermediateToken(token);
  if (!payload) {
    return NextResponse.json(
      { error: "Session expired. Please sign in with Google again." },
      { status: 401 }
    );
  }

  // Double-check email still matches ADMIN_EMAIL (env could have changed)
  const adminEmail    = (process.env.ADMIN_EMAIL    ?? "").toLowerCase().trim();
  const adminPassword =  process.env.ADMIN_PASSWORD ?? "";

  if (!adminEmail || payload.email.toLowerCase().trim() !== adminEmail) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  if (!adminPassword || password !== adminPassword) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  // Both factors verified — issue full admin session cookie
  const adminToken = buildAdminToken(payload.email);
  const res        = NextResponse.json({ success: true });
  res.headers.set("Set-Cookie", buildAdminCookie(adminToken));
  return res;
}
