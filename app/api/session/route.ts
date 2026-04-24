import { NextRequest } from "next/server";
import { createSession, getSessionFromRequest } from "@/lib/services/session";
import { validateEmail } from "@/lib/services/leadCapture";

// POST /api/session — create a free session for an email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, visaPreference } = body as {
      email?: string;
      visaPreference?: string;
    };

    if (!email || !validateEmail(email)) {
      return Response.json({ error: "Valid email is required." }, { status: 400 });
    }

    const token = createSession(email, false, visaPreference);
    return Response.json({ token, isPaid: false });
  } catch {
    return Response.json({ error: "Failed to create session." }, { status: 500 });
  }
}

// GET /api/session — verify an existing session token
export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return Response.json({ valid: false, isPaid: false });
  }
  return Response.json({
    valid: true,
    email: session.email,
    isPaid: session.isPaid,
  });
}
