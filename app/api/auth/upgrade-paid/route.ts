import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser, upgradeToPremium } from "@/lib/services/userStore";
import { createSession, buildSessionCookie } from "@/lib/services/session";
import { validateEmail, trackPayment } from "@/lib/services/leadCapture";

// Used after PayPal payment is captured on the frontend.
// The capture already happened server-side via /api/paypal/capture-order —
// this endpoint upgrades the user plan and sets the session cookie.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, provider, orderId, amount, currency } = body as {
      email?: string;
      provider?: string;
      orderId?: string;
      amount?: number;
      currency?: string;
    };

    if (!email || !validateEmail(email)) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    getOrCreateUser(email);
    const user = upgradeToPremium(email);

    if (!user) {
      return NextResponse.json({ error: "Failed to upgrade user." }, { status: 500 });
    }

    if (provider && orderId) {
      trackPayment({
        provider: (provider as "razorpay" | "stripe") ?? "razorpay",
        email: email.toLowerCase(),
        amount: amount ?? 0,
        currency: currency ?? "USD",
        timestamp: new Date().toISOString(),
      });
    }

    const token = createSession(email, true);
    const res = NextResponse.json({ success: true, plan: "premium" });
    res.headers.set("Set-Cookie", buildSessionCookie(token));
    return res;
  } catch {
    return NextResponse.json({ error: "Failed to upgrade plan." }, { status: 500 });
  }
}
