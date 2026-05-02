import { NextRequest, NextResponse } from "next/server";

const PAYPAL_BASE =
  process.env.PAYPAL_API_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com");

const PLAN_AMOUNTS: Record<string, { amount: string; label: string }> = {
  pro:          { amount: "99.00",  label: "Pro Plan"      },
  premium:      { amount: "199.00", label: "Prime Plan"    },
  full_report:  { amount: "49.00",  label: "Full Report"   },
};

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
  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status}`);
  const data = await res.json();
  return data.access_token as string;
}

export async function POST(req: NextRequest) {
  let plan: string;
  let email: string;

  try {
    const body = await req.json();
    plan  = (body.plan  as string)?.toLowerCase() ?? "";
    email = (body.email as string) ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const planData = PLAN_AMOUNTS[plan];
  if (!planData) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  const origin =
    req.headers.get("origin") ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  try {
    const token = await getAccessToken();

    const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount:      { currency_code: "USD", value: planData.amount },
            description: `VisaPro AI — ${planData.label}`,
            custom_id:   email || "anonymous",
          },
        ],
        application_context: {
          brand_name:          "VisaPro AI",
          landing_page:        "NO_PREFERENCE",
          user_action:         "PAY_NOW",
          return_url:          `${origin}/payment/success`,
          cancel_url:          `${origin}/pricing`,
        },
      }),
    });

    if (!res.ok) throw new Error(`PayPal order creation failed: ${res.status}`);
    const order = await res.json();

    const approvalUrl = (order.links as { rel: string; href: string }[])
      ?.find((l) => l.rel === "approve")?.href;

    return NextResponse.json({ orderId: order.id, approvalUrl, plan });
  } catch (err) {
    console.error("[paypal/create-order]", err);
    return NextResponse.json({ error: "Failed to create payment order." }, { status: 500 });
  }
}
