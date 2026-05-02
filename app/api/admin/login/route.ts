import { NextRequest, NextResponse } from "next/server";
import { buildAdminToken, buildAdminCookie } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const adminEmail    = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return NextResponse.json({ error: "Admin credentials not configured." }, { status: 503 });
  }

  let email: string, password: string;
  try {
    const body = await req.json();
    email    = (body.email    as string) ?? "";
    password = (body.password as string) ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (
    email.toLowerCase().trim() !== adminEmail.toLowerCase().trim() ||
    password !== adminPassword
  ) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const token = buildAdminToken(email);
  const res   = NextResponse.json({ success: true });
  res.headers.set("Set-Cookie", buildAdminCookie(token));
  return res;
}
