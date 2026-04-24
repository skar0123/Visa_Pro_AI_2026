import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { createSession, buildSessionCookie } from "@/lib/services/session";
import { validateEmail, trackPayment } from "@/lib/services/leadCapture";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email } =
      body as {
        razorpay_order_id?: string;
        razorpay_payment_id?: string;
        razorpay_signature?: string;
        email?: string;
      };

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing payment fields." },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json(
        { error: "Payment configuration error." },
        { status: 500 }
      );
    }

    // Verify Razorpay HMAC-SHA256 signature
    const expectedSig = createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSig !== razorpay_signature) {
      return NextResponse.json(
        { error: "Invalid payment signature." },
        { status: 400 }
      );
    }

    const sessionEmail =
      email && validateEmail(email)
        ? email
        : `razorpay_${razorpay_payment_id}@visapro.ai`;

    const token = createSession(sessionEmail, true);

    // Track payment in persistent store
    trackPayment({
      provider: "razorpay",
      email: sessionEmail,
      amount: 300000, // ₹3000 in paise
      currency: "INR",
      timestamp: new Date().toISOString(),
    });

    // Set HTTP-only session cookie — browser sends it automatically on all requests
    const res = NextResponse.json({ success: true, isPaid: true });
    res.headers.set("Set-Cookie", buildSessionCookie(token));
    return res;
  } catch (err) {
    console.error("[razorpay-verify] error:", err);
    return NextResponse.json(
      { error: "Payment verification failed." },
      { status: 500 }
    );
  }
}
