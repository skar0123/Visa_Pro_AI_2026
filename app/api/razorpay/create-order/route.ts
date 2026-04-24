import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

const PLAN_AMOUNTS: Record<string, number> = {
  pro: 99900,           // ₹999 in paise
  premium: 299900,      // ₹2999 in paise
  full_report: 300000,  // ₹3000 in paise — full AI report unlock
};

export async function POST(req: NextRequest) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return NextResponse.json(
      { error: "Razorpay credentials not configured." },
      { status: 500 }
    );
  }

  let plan: string;
  try {
    const body = await req.json();
    plan = (body.plan as string)?.toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const amount = PLAN_AMOUNTS[plan];
  if (!amount) {
    return NextResponse.json(
      { error: "Invalid plan. Must be 'pro', 'premium', or 'full_report'." },
      { status: 400 }
    );
  }

  try {
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `receipt_${plan}_${Date.now()}`,
      notes: { plan },
    });

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      plan,
    });
  } catch (err) {
    console.error("Razorpay order creation failed:", err);
    return NextResponse.json(
      { error: "Failed to create payment order." },
      { status: 500 }
    );
  }
}
