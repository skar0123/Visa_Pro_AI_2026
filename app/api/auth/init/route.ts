import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/db/users";
import { createSession, buildSessionCookie } from "@/lib/services/session";
import { validateEmail } from "@/lib/db/leads";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body as { email?: string };

    if (!email || !validateEmail(email)) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    const user  = await getOrCreateUser(email);
    const isPaid = user.plan === "pro" || user.plan === "premium";
    const token = createSession(email, isPaid);

    const res = NextResponse.json({
      success: true,
      plan:        user.plan,
      usage_count: user.usageCount,
    });
    res.headers.set("Set-Cookie", buildSessionCookie(token));
    return res;
  } catch {
    return NextResponse.json({ error: "Failed to initialize session." }, { status: 500 });
  }
}
