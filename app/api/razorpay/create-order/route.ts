import { NextRequest, NextResponse } from "next/server";
import { createPendingPayment } from "@/lib/db/payments";

const PLAN_AMOUNTS: Record<string, { amount: number; label: string }> = {
  pro:         { amount: 829900,  label: "Pro Plan"    },
  premium:     { amount: 1659900, label: "Prime Plan"  },
  full_report: { amount: 409900,  label: "Full Report" },
};

export async function POST(req: NextRequest) {
  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return NextResponse.json({ error: "Payment system not configured." }, { status: 500 });
  }

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

  try {
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      },
      body: JSON.stringify({
        amount:  planData.amount,
        currency: "INR",
        receipt: `vp_${plan}_${Date.now()}`,
        notes:   { plan, label: planData.label, email: email || "anonymous" },
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("[razorpay/create-order]", err);
      return NextResponse.json({ error: "Failed to create payment order." }, { status: 502 });
    }

    const order = await res.json();

    // Persist pending order to DB
    if (email) {
      await createPendingPayment({
        email,
        orderId:  order.id,
        plan,
        amount:   order.amount,
        currency: order.currency,
      }).catch((e) => console.warn("[razorpay/create-order] DB write failed:", e));
    }

    return NextResponse.json({
      order_id: order.id,
      amount:   order.amount,
      currency: order.currency,
      plan,
    });
  } catch (err) {
    console.error("[razorpay/create-order]", err);
    return NextResponse.json({ error: "Failed to create payment order." }, { status: 500 });
  }
}
