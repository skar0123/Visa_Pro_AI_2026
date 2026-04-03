import { NextRequest, NextResponse } from "next/server";

const PLAN_AMOUNTS: Record<string, string> = {
  pro: "29.00",
  premium: "99.00",
};

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
  let plan: string;
  try {
    const body = await req.json();
    plan = (body.plan as string)?.toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const amount = PLAN_AMOUNTS[plan];
  if (!amount) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  try {
    const token = await getAccessToken();

    const res = await fetch(`${BASE_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: { currency_code: "USD", value: amount },
            description: `NeuralOps AI — ${plan === "pro" ? "Pro" : "Premium"} Plan`,
          },
        ],
      }),
    });

    if (!res.ok) throw new Error(`PayPal order creation failed: ${res.status}`);
    const order = await res.json();

    return NextResponse.json({ id: order.id, plan });
  } catch (err) {
    console.error("PayPal create-order error:", err);
    return NextResponse.json({ error: "Failed to create PayPal order." }, { status: 500 });
  }
}
