import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { createSession, buildSessionCookie } from "@/lib/services/session";

export async function POST(req: NextRequest) {
  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json(
      { error: "Missing required payment fields." },
      { status: 400 }
    );
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json(
      { error: "Razorpay secret not configured." },
      { status: 500 }
    );
  }

  // Verify HMAC-SHA256 signature per Razorpay docs
  const expectedSig = createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSig !== razorpay_signature) {
    console.log("[razorpay/verify] INVALID signature — possible tampering");
    return NextResponse.json(
      { error: "Payment verification failed." },
      { status: 400 }
    );
  }

  console.log(`[razorpay/verify] Payment verified — order=${razorpay_order_id}`);

  // Issue paid session cookie
  const token = createSession(email || "razorpay-user@visapro.ai", true);
  const cookie = buildSessionCookie(token);

  return NextResponse.json(
    { success: true, payment_id: razorpay_payment_id },
    { headers: { "Set-Cookie": cookie } }
  );
}
