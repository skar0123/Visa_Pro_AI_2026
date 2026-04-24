import { NextRequest } from "next/server";
import { captureLead, validateEmail } from "@/lib/services/leadCapture";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, visaPreference, score } = body as {
      name?: string;
      email?: string;
      visaPreference?: string;
      score?: number;
    };

    if (!email || !validateEmail(email)) {
      return Response.json({ error: "Valid email is required." }, { status: 400 });
    }

    const result = await captureLead({
      name: (name || "Anonymous").slice(0, 120),
      email,
      visaPreference: visaPreference?.slice(0, 50),
      score: typeof score === "number" ? Math.max(0, Math.min(100, score)) : 0,
      timestamp: new Date().toISOString(),
    });

    return Response.json({ ok: result.ok, duplicate: result.duplicate });
  } catch {
    return Response.json({ error: "Lead capture failed." }, { status: 500 });
  }
}
