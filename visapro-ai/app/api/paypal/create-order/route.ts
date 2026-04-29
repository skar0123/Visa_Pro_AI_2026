import { NextRequest, NextResponse } from "next/server";
import { PAYPAL_AMOUNTS, type PaidPlanId } from "@/lib/pricing";

// Set PAYPAL_API_URL=https://api-m.paypal.com in Vercel for live payments.
// Defaults to sandbox when the variable is absent.
const BASE_URL = process.env.PAYPAL_API_URL ?? "https://api-m.sandbox.paypal.com";
const MODE = BASE_URL.includes("sandbox") ? "SANDBOX" : "LIVE";

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  // Accept both PAYPAL_CLIENT_SECRET (new) and PAYPAL_SECRET (legacy Vercel name)
  const secret = process.env.PAYPAL_CLIENT_SECRET ?? process.env.PAYPAL_SECRET;

  console.log("[PayPal][create-order] env check", {
    mode: MODE,
    baseUrl: BASE_URL,
    hasClientId: !!clientId,
    hasSecret: !!secret,
    clientIdPrefix: clientId?.slice(0, 10),
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
    console.error("[PayPal][create-order] Auth failed:", res.status, body);
    throw new Error(`PayPal auth failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  console.log("[PayPal][create-order] Access token obtained.");
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

  const amount = PAYPAL_AMOUNTS[plan as PaidPlanId];
  if (!amount) {
    return NextResponse.json({ error: `Invalid plan "${plan}". Must be "pro" or "premium".` }, { status: 400 });
  }

  console.log("[PayPal][create-order] Creating order — plan:", plan, "amount:", amount, "mode:", MODE);

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
            amount: {
              currency_code: "USD",
              value: amount,
            },
            description: `NeuralOps AI — ${plan === "pro" ? "Pro" : "Premium"} Plan`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[PayPal][create-order] Order creation failed:", res.status, body);
      throw new Error(`PayPal order creation failed (${res.status}): ${body}`);
    }

    const order = await res.json();
    console.log("[PayPal][create-order] Order created:", order.id, "status:", order.status);

    // Return order.id — this is what the frontend PayPal SDK needs
    return NextResponse.json({ id: order.id, plan });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[PayPal][create-order] Error:", message);
    return NextResponse.json({ error: "Failed to create PayPal order.", detail: message }, { status: 500 });
  }
}
