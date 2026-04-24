import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const PRICE_USD_CENTS = 15000; // $150.00

export async function POST(request: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "Stripe is not configured." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email : undefined;

    const stripe = new Stripe(secretKey);

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: PRICE_USD_CENTS,
            product_data: {
              name: "VisaPro AI — Full Analysis Report",
              description:
                "Complete AI-powered visa readiness report: hybrid ML+RAG analysis, gap analysis, roadmap, RFE predictor, and approval simulation.",
            },
          },
          quantity: 1,
        },
      ],
      customer_email: email,
      success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/results`,
      metadata: {
        product: "visapro_full_report",
        email: email || "",
      },
    });

    return NextResponse.json({ url: session.url, session_id: session.id });
  } catch (err) {
    console.error("[stripe] create-checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session." },
      { status: 500 }
    );
  }
}
