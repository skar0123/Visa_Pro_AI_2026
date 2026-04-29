import { NextRequest } from "next/server";
import { createHmac } from "crypto";
import {
  evaluateProfile,
  generateRoadmap,
  generateRFEPredictions,
  computeApprovalSimulation,
  ProfileInput,
} from "@/lib/ai";

// ── Inline session verification (no imported helper — fully auditable) ─────────

function resolveIsPaid(request: NextRequest): boolean {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    console.log("[evaluate] WARNING: SESSION_SECRET not set — all users FREE");
    return false;
  }

  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/visapro_session=([^;]+)/);
  if (!match) {
    console.log("[evaluate] visapro_session cookie: NOT FOUND");
    return false;
  }

  const raw = decodeURIComponent(match[1]);
  try {
    const dot = raw.lastIndexOf(".");
    if (dot < 1) return false;
    const data = raw.slice(0, dot);
    const sig = raw.slice(dot + 1);
    const expected = createHmac("sha256", secret).update(data).digest("base64url");
    if (sig !== expected) {
      console.log("[evaluate] visapro_session: INVALID signature");
      return false;
    }
    const payload = JSON.parse(Buffer.from(data, "base64url").toString());
    if (!payload.exp || payload.exp < Date.now()) {
      console.log("[evaluate] visapro_session: EXPIRED");
      return false;
    }
    console.log(`[evaluate] visapro_session: VALID — email=${payload.email} isPaid=${payload.isPaid}`);
    return payload.isPaid === true;
  } catch {
    console.log("[evaluate] visapro_session: parse error");
    return false;
  }
}

async function sendLeadToWebhook(
  name: string,
  email: string,
  overall_score: number,
  education: string
): Promise<void> {
  const webhookUrl = process.env.WEBHOOK_URL;
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        overall_score,
        education_snippet: education.slice(0, 200),
        submitted_at: new Date().toISOString(),
      }),
    });
  } catch {
    // fire-and-forget
  }
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { name, email, education, experience, skills } =
    body as unknown as ProfileInput & { email?: string };

  if (!education && !experience && !skills) {
    return Response.json(
      { error: "At least one profile field is required." },
      { status: 400 }
    );
  }

  // ── Step 1: Determine access ──────────────────────────────────────────────
  const isPaid = resolveIsPaid(request);
  console.log("USER ACCESS:", { isPaid });

  // ── Step 2: Run full pipeline ─────────────────────────────────────────────
  const input: ProfileInput = {
    name: name || "Applicant",
    education: (education as string) || "",
    experience: (experience as string) || "",
    skills: (skills as string) || "",
  };

  const result = evaluateProfile(input);
  const roadmap = isPaid ? generateRoadmap(input, result) : null;
  const rfe_predictions = isPaid ? generateRFEPredictions(input, result) : null;
  const approval_simulation = isPaid ? computeApprovalSimulation(input, result) : null;

  // ── Step 3: Lead capture (non-blocking) ───────────────────────────────────
  if (email && typeof email === "string") {
    sendLeadToWebhook(
      (name as string) || "Anonymous",
      email,
      result.overall_score,
      (education as string) || ""
    ).catch(() => {});
  }

  // ── Step 4: Return access-gated response ──────────────────────────────────
  if (!isPaid) {
    console.log(
      `[evaluate] FREE response — score=${result.overall_score} only`
    );
    return Response.json({
      overall_score: result.overall_score,
      visa_probabilities: result.visa_probabilities,
      isPremiumLocked: true,
    });
  }

  console.log("[evaluate] PAID response — returning full report");
  return Response.json({
    ...result,
    roadmap,
    rfe_predictions,
    approval_simulation,
    isPremiumLocked: false,
  });
}
