import { NextRequest, NextResponse } from "next/server";
import { createSession, buildSessionCookie } from "@/lib/services/session";

// Must match the same environment used in create-order.
// Set PAYPAL_API_URL=https://api-m.paypal.com in Vercel for live payments.
const BASE_URL = process.env.PAYPAL_API_URL ?? "https://api-m.sandbox.paypal.com";
const MODE = BASE_URL.includes("sandbox") ? "SANDBOX" : "LIVE";

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  // Accept both PAYPAL_CLIENT_SECRET (new) and PAYPAL_SECRET (legacy Vercel name)
  const secret = process.env.PAYPAL_CLIENT_SECRET ?? process.env.PAYPAL_SECRET;

  console.log("[PayPal][capture-order] env check", {
    mode: MODE,
    hasClientId: !!clientId,
    hasSecret: !!secret,
  });

  if (!clientId || !secret) {
    const missing = [
      !clientId && "PAYPAL_CLIENT_ID",
      !secret && "PAYPAL_CLIENT_SECRET (or PAYPAL_SECRET)",
    ].filter(Boolean);
    throw new Error(`PayPal credentials not configured. Missing: ${missing.join(", ")}`);
  }

  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");

  const res = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[PayPal][capture-order] Auth failed:", res.status, body);
    throw new Error(`PayPal auth failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

export async function POST(req: NextRequest) {
  let orderID: string;
  try {
    const body = await req.json();
    orderID = body.orderID as string;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!orderID) {
    return NextResponse.json({ error: "Missing orderID." }, { status: 400 });
  }

  console.log("[PayPal][capture-order] Capturing order:", orderID, "mode:", MODE);

  try {
    const token = await getAccessToken();

    const res = await fetch(`${BASE_URL}/v2/checkout/orders/${orderID}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[PayPal][capture-order] Capture failed:", res.status, body);
      throw new Error(`PayPal capture failed (${res.status}): ${body}`);
    }

    const capture = await res.json();
    console.log("[PayPal][capture-order] Captured:", capture.id, "status:", capture.status);

    if (capture.status !== "COMPLETED") {
      return NextResponse.json(
        { error: `Payment not completed. Status: ${capture.status}` },
        { status: 400 }
      );
    }

    // Issue paid session cookie
    const payerEmail = (capture.payer?.email_address as string | undefined) ?? "paypal-user@visapro.ai";
    const sessionToken = createSession(payerEmail, true);
    const cookie = buildSessionCookie(sessionToken);

    return NextResponse.json(
      { status: capture.status, orderID: capture.id, payer: payerEmail },
      { headers: { "Set-Cookie": cookie } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[PayPal][capture-order] Error:", message);
    return NextResponse.json({ error: "Failed to capture PayPal order.", detail: message }, { status: 500 });
  }
}
