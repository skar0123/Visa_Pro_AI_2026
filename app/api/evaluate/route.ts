import { NextRequest } from "next/server";
import { createHmac } from "crypto";
import {
  evaluateProfile,
  generateRoadmap,
  generateRFEPredictions,
  computeApprovalSimulation,
  ProfileInput,
} from "@/lib/ai";
import { runHybridEvaluation } from "@/lib/hybrid";
import { captureLead, validateEmail } from "@/lib/services/leadCapture";

// ── Session verification (inline — no imported helper, fully auditable) ────────

function getSessionSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) {
    console.warn(
      "[evaluate] WARNING: SESSION_SECRET env var is NOT set. " +
        "All requests will be treated as FREE users."
    );
  }
  return s || "";
}

function verifySessionToken(raw: string): { isPaid: boolean; email: string } | null {
  const secret = getSessionSecret();
  if (!secret) return null; // no secret → cannot verify any token → free

  try {
    const dot = raw.lastIndexOf(".");
    if (dot < 1) return null;

    const data = raw.slice(0, dot);
    const sig = raw.slice(dot + 1);
    const expected = createHmac("sha256", secret)
      .update(data)
      .digest("base64url");

    if (sig !== expected) {
      console.log("[evaluate] token signature MISMATCH — treating as free");
      return null;
    }

    const payload = JSON.parse(Buffer.from(data, "base64url").toString());

    if (!payload.exp || payload.exp < Date.now()) {
      console.log("[evaluate] token EXPIRED — treating as free");
      return null;
    }

    return { isPaid: payload.isPaid === true, email: payload.email ?? "" };
  } catch (err) {
    console.log("[evaluate] token parse error:", err);
    return null;
  }
}

function resolveAccessFromCookie(request: NextRequest): boolean {
  // ONLY the HTTP-only cookie is trusted.
  // Authorization header fallback is intentionally removed —
  // old localStorage tokens must not grant access.
  const cookieHeader = request.headers.get("cookie") || "";

  console.log(
    "[evaluate] COOKIE header:",
    cookieHeader ? cookieHeader.replace(/visapro_session=[^;]+/, "visapro_session=<redacted>") : "(none)"
  );

  const match = cookieHeader.match(/visapro_session=([^;]+)/);
  if (!match) {
    console.log("[evaluate] visapro_session cookie: NOT FOUND");
    return false;
  }

  const raw = decodeURIComponent(match[1]);
  const session = verifySessionToken(raw);

  if (!session) {
    console.log("[evaluate] visapro_session cookie: INVALID or EXPIRED");
    return false;
  }

  console.log(
    `[evaluate] visapro_session cookie: VALID — email=${session.email} isPaid=${session.isPaid}`
  );
  return session.isPaid;
}

// ── Access-controlled response builder ───────────────────────────────────────

function buildFreeResponse(
  overallScore: number,
  hybridScore: number | undefined,
  visaProbabilities: Record<string, number>
): Record<string, unknown> {
  const score = hybridScore ?? overallScore;
  // STRICT: only score + probabilities — NO gaps, roadmap, RFE, hybrid_analysis, sections.
  // overall_score is included as a UI-compatibility alias for final_score (same value).
  return {
    final_score: score,
    overall_score: score, // alias: frontend StoredResult requires this field
    visa_probabilities: visaProbabilities,
    isPremiumLocked: true,
  };
}

function buildPaidResponse(full: Record<string, unknown>): Record<string, unknown> {
  return full;
}

// ── Handler ───────────────────────────────────────────────────────────────────

function memMB(): string {
  const m = process.memoryUsage();
  return `rss=${Math.round(m.rss / 1048576)}MB heapUsed=${Math.round(m.heapUsed / 1048576)}MB`;
}

export async function POST(request: NextRequest) {
  console.log(`\n[evaluate] ===== NEW REQUEST ===== ${new Date().toISOString()} — ${memMB()}`);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { name, email, education, experience, skills } = body as unknown as ProfileInput & {
    email?: string;
  };

  if (!education && !experience && !skills) {
    return Response.json(
      { error: "At least one profile field is required." },
      { status: 400 }
    );
  }

  // ── Step 1: Determine access level ──────────────────────────────────────────
  const isPaid = resolveAccessFromCookie(request);

  console.log(`[evaluate] IS_PAID: ${isPaid}`);
  console.log(`[evaluate] RETURN TYPE: ${isPaid ? "PAID — full report" : "FREE — score + probabilities only"}`);

  // ── Step 2: Run full pipeline (always, regardless of tier) ──────────────────
  const input: ProfileInput = {
    name: name || "Applicant",
    education: (education as string) || "",
    experience: (experience as string) || "",
    skills: (skills as string) || "",
  };

  const result = evaluateProfile(input);
  const roadmap = generateRoadmap(input, result);
  const rfe_predictions = generateRFEPredictions(input, result);
  const approval_simulation = computeApprovalSimulation(input, result);
  const hybrid_analysis = await runHybridEvaluation(input).catch(() => null);

  console.log(
    `[evaluate] pipeline done — overall_score=${result.overall_score} ` +
      `hybrid_score=${hybrid_analysis?.final_score ?? "n/a"} ` +
      `confidence=${hybrid_analysis?.confidence_level ?? "n/a"}`
  );

  // ── Step 3: Lead capture (always, non-blocking) ──────────────────────────────
  if (email && typeof email === "string" && validateEmail(email)) {
    captureLead({
      name: (name as string) || "Anonymous",
      email,
      score: result.overall_score,
      timestamp: new Date().toISOString(),
    }).catch(() => {});
  }

  // ── Step 4: Apply strict access control ──────────────────────────────────────
  if (!isPaid) {
    console.log(
      `[evaluate] FREE response — returning ONLY: final_score=${hybrid_analysis?.final_score ?? result.overall_score}, visa_probabilities`
    );

    return Response.json(
      buildFreeResponse(
        result.overall_score,
        hybrid_analysis?.final_score,
        result.visa_probabilities as unknown as Record<string, number>
      )
    );
  }

  // Paid: assemble and return full report
  const fullResponse: Record<string, unknown> = {
    ...result,
    roadmap,
    rfe_predictions,
    approval_simulation,
    ...(hybrid_analysis ? { hybrid_analysis } : {}),
  };

  console.log(
    `[evaluate] PAID response — returning full report ` +
      `(${Object.keys(fullResponse).join(", ")})`
  );

  return Response.json(buildPaidResponse(fullResponse));
}
