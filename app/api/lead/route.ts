import { NextRequest } from "next/server";
import { captureLead, validateEmail } from "@/lib/db/leads";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, country, visaCategory, score } = body as {
      name?: string;
      email?: string;
      phone?: string;
      country?: string;
      visaCategory?: string;
      score?: number;
    };

    if (!email || !validateEmail(email)) {
      return Response.json({ error: "Valid email is required." }, { status: 400 });
    }

    await captureLead({
      name:            (name || "Anonymous").slice(0, 120),
      email,
      phone:           phone?.slice(0, 20),
      country:         country?.slice(0, 60),
      visaCategory:    visaCategory?.slice(0, 50),
      evaluationScore: typeof score === "number" ? Math.max(0, Math.min(100, score)) : undefined,
    });

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Lead capture failed." }, { status: 500 });
  }
}
