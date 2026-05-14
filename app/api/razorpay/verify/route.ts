import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { getSessionFromRequest, createSession, buildSessionCookie } from "@/lib/services/session";
import { getOrCreateUser, upgradePlan } from "@/lib/db/users";
import { capturePayment } from "@/lib/db/payments";

export async function POST(req: NextRequest) {
  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email, plan } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing required payment fields." }, { status: 400 });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json({ error: "Payment system not configured." }, { status: 500 });
  }

  // Verify HMAC-SHA256 signature per Razorpay docs
  const expectedSig = createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSig !== razorpay_signature) {
    console.warn("[razorpay/verify] signature mismatch — possible tampering");
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }

  const session       = getSessionFromRequest(req);
  const resolvedEmail = (email || session?.email || "").toLowerCase().trim();

  if (!resolvedEmail) {
    return NextResponse.json({ error: "Cannot identify user." }, { status: 400 });
  }

  // Determine the plan to upgrade to
  const targetPlan: "pro" | "premium" =
    plan === "premium" ? "premium" : "pro";

  try {
    // Upgrade user in DB
    await getOrCreateUser(resolvedEmail, session?.name);
    await upgradePlan(resolvedEmail, targetPlan);

    // Mark payment as captured in DB
    await capturePayment(razorpay_order_id, razorpay_payment_id, razorpay_signature).catch(
      (e) => console.warn("[razorpay/verify] capturePayment failed:", e)
    );
  } catch (err) {
    console.error("[razorpay/verify] DB update failed:", err);
    return NextResponse.json({ error: "Failed to upgrade account." }, { status: 500 });
  }

  // Issue fresh session cookie with isPaid = true
  const newToken = createSession(resolvedEmail, true, undefined, session?.name);
  const response = NextResponse.json({ success: true, payment_id: razorpay_payment_id });
  response.headers.set("Set-Cookie", buildSessionCookie(newToken));
  return response;
}
