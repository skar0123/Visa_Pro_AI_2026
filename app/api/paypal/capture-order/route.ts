import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, createSession, buildSessionCookie } from "@/lib/services/session";
import { getOrCreateUser, upgradeToPremium } from "@/lib/services/userStore";
import { trackPayment } from "@/lib/services/leadCapture";

const PAYPAL_BASE =
  process.env.PAYPAL_API_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com");

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret   = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) throw new Error("PayPal credentials not configured.");

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal auth: ${res.status}`);
  const data = await res.json();
  return data.access_token as string;
}

export async function POST(req: NextRequest) {
  let orderId: string;

  try {
    const body = await req.json();
    orderId = body.orderId as string;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId." }, { status: 400 });
  }

  // Determine email: prefer session cookie, fall back to PayPal order custom_id
  const session = getSessionFromRequest(req);

  try {
    const token = await getAccessToken();

    const captureRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!captureRes.ok) {
      const err = await captureRes.json();
      console.error("[paypal/capture]", err);
      return NextResponse.json({ error: "Payment capture failed." }, { status: 502 });
    }

    const capture = await captureRes.json();
    if (capture.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Payment not completed.", status: capture.status },
        { status: 400 }
      );
    }

    // Resolve email: session → PayPal payer → custom_id
    const payerEmail = capture.payer?.email_address as string | undefined;
    const customId   = capture.purchase_units?.[0]?.custom_id as string | undefined;
    const email      = session?.email ?? payerEmail ?? customId ?? "";

    if (!email) {
      return NextResponse.json({ error: "Cannot identify user email." }, { status: 400 });
    }

    const amountValue = parseFloat(
      capture.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value ?? "0"
    );

    // Upgrade user
    getOrCreateUser(email, session?.name);
    upgradeToPremium(email);

    trackPayment({
      provider: "paypal",
      email: email.toLowerCase(),
      amount: Math.round(amountValue * 100),
      currency: "USD",
      timestamp: new Date().toISOString(),
    });

    // Refresh session cookie as paid
    const newToken = createSession(email, true, undefined, session?.name);
    const response = NextResponse.json({ success: true, email });
    response.headers.set("Set-Cookie", buildSessionCookie(newToken));
    return response;
  } catch (err) {
    console.error("[paypal/capture]", err);
    return NextResponse.json({ error: "Capture failed." }, { status: 500 });
  }
}
