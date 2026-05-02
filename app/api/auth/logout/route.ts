import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/services/session";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.headers.set("Set-Cookie", clearSessionCookie());
  return res;
}

export async function GET() {
  const res = NextResponse.redirect(
    new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")
  );
  res.headers.set("Set-Cookie", clearSessionCookie());
  return res;
}
