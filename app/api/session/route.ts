import { NextRequest } from "next/server";
import { createSession, getSessionFromRequest } from "@/lib/services/session";
import { validateEmail } from "@/lib/services/leadCapture";
import { getUserByEmail } from "@/lib/services/userStore";

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

// GET /api/session — verify session, return current plan from store
export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) return Response.json({ valid: false });

  const user = getUserByEmail(session.email);
  return Response.json({
    valid: true,
    email:  session.email,
    name:   session.name ?? user?.name ?? null,
    plan:   user?.plan ?? "free",
    isPaid: user?.plan === "premium",
  });
}
