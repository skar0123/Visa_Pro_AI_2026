import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { getOrCreateUser, upgradeToPremium } from "@/lib/services/userStore";
import { trackPayment } from "@/lib/services/leadCapture";

// Razorpay webhook: fires server-to-server when a payment is completed.
// Set webhook secret in Razorpay dashboard → same value as RAZORPAY_WEBHOOK_SECRET env var.
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      const expected = createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");
      if (expected !== signature) {
        return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
      }
    }

    const event = JSON.parse(rawBody) as {
      event: string;
      payload?: {
        payment?: {
          entity?: {
            id: string;
            order_id: string;
            email: string;
            amount: number;
            currency: string;
            notes?: Record<string, string>;
          };
        };
      };
    };

    if (event.event !== "payment.captured") {
      return NextResponse.json({ received: true });
    }

    const entity = event.payload?.payment?.entity;
    if (!entity) return NextResponse.json({ received: true });

    const email = entity.email || entity.notes?.email;
    if (!email) return NextResponse.json({ received: true });

    getOrCreateUser(email);
    upgradeToPremium(email);

    trackPayment({
      provider: "razorpay",
      email: email.toLowerCase(),
      amount: entity.amount,
      currency: entity.currency,
      timestamp: new Date().toISOString(),
    });

    console.log(`[webhook/razorpay] upgraded email=${email} payment_id=${entity.id}`);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhook/razorpay] error:", err);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
