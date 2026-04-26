import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/services/userStore";
import { createSession, buildSessionCookie } from "@/lib/services/session";
import { validateEmail } from "@/lib/services/leadCapture";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body as { email?: string };

    if (!email || !validateEmail(email)) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    const user = getOrCreateUser(email);
    const token = createSession(email, user.plan === "premium");

    const res = NextResponse.json({
      success: true,
      plan: user.plan,
      usage_count: user.usage_count,
    });
    res.headers.set("Set-Cookie", buildSessionCookie(token));
    return res;
  } catch {
    return NextResponse.json({ error: "Failed to initialize session." }, { status: 500 });
  }
}
