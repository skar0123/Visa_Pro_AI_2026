import { NextRequest, NextResponse } from "next/server";

const BASE_URL = process.env.PAYPAL_API_URL ?? "https://api-m.sandbox.paypal.com";

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) throw new Error("PayPal credentials not configured.");

  const res = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status}`);
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

  try {
    const token = await getAccessToken();

    const res = await fetch(`${BASE_URL}/v2/checkout/orders/${orderID}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error(`PayPal capture failed: ${res.status}`);
    const capture = await res.json();

    return NextResponse.json({
      status: capture.status,
      orderID: capture.id,
      payer: capture.payer?.email_address ?? null,
    });
  } catch (err) {
    console.error("PayPal capture-order error:", err);
    return NextResponse.json({ error: "Failed to capture PayPal order." }, { status: 500 });
  }
}
