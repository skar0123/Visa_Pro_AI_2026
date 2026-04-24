import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createSession, buildSessionCookie } from "@/lib/services/session";
import { validateEmail, trackPayment } from "@/lib/services/leadCapture";

export async function POST(request: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "Stripe is not configured." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { session_id } = body as { session_id?: string };

    if (!session_id) {
      return NextResponse.json(
        { error: "Missing session_id." },
        { status: 400 }
      );
    }

    const stripe = new Stripe(secretKey);
    const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);

    if (checkoutSession.payment_status !== "paid") {
      return NextResponse.json(
        {
          error: "Payment not completed.",
          status: checkoutSession.payment_status,
        },
        { status: 400 }
      );
    }

    const rawEmail =
      checkoutSession.customer_email ||
      (checkoutSession.metadata?.email as string | undefined);

    const sessionEmail =
      rawEmail && validateEmail(rawEmail)
        ? rawEmail
        : `stripe_${checkoutSession.id}@visapro.ai`;

    const token = createSession(sessionEmail, true);

    // Track payment in persistent store
    trackPayment({
      provider: "stripe",
      email: sessionEmail,
      amount: checkoutSession.amount_total ?? 15000,
      currency: checkoutSession.currency ?? "usd",
      timestamp: new Date().toISOString(),
    });

    // Set HTTP-only session cookie
    const res = NextResponse.json({ success: true, isPaid: true, email: sessionEmail });
    res.headers.set("Set-Cookie", buildSessionCookie(token));
    return res;
  } catch (err) {
    console.error("[stripe-verify] error:", err);
    return NextResponse.json(
      { error: "Payment verification failed." },
      { status: 500 }
    );
  }
}
