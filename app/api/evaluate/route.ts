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
import {
  getOrCreateUser,
  incrementUsage,
  FREE_USAGE_LIMIT,
} from "@/lib/services/userStore";

// ── Session verification ──────────────────────────────────────────────────────

function getSessionSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) {
    console.warn(
      "[evaluate] WARNING: SESSION_SECRET not set — all requests treated as free."
    );
  }
  return s || "";
}

function extractEmailFromCookie(request: NextRequest): string | null {
  const secret = getSessionSecret();
  if (!secret) return null;

  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/visapro_session=([^;]+)/);
  if (!match) return null;

  try {
    const raw = decodeURIComponent(match[1]);
    const dot = raw.lastIndexOf(".");
    if (dot < 1) return null;

    const data = raw.slice(0, dot);
    const sig = raw.slice(dot + 1);
    const expected = createHmac("sha256", secret).update(data).digest("base64url");
    if (sig !== expected) return null;

    const payload = JSON.parse(Buffer.from(data, "base64url").toString());
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload.email ?? null;
  } catch {
    return null;
  }
}

// ── Response builders ─────────────────────────────────────────────────────────

function buildFreeResponse(
  overallScore: number,
  hybridScore: number | undefined,
  visaProbabilities: Record<string, number>
): Record<string, unknown> {
  const score = hybridScore ?? overallScore;
  return {
    final_score: score,
    overall_score: score,
    visa_probabilities: visaProbabilities,
    isPremiumLocked: true,
  };
}

// ── Handler ───────────────────────────────────────────────────────────────────

function memMB(): string {
  const m = process.memoryUsage();
  return `rss=${Math.round(m.rss / 1048576)}MB heapUsed=${Math.round(m.heapUsed / 1048576)}MB`;
}

export async function POST(request: NextRequest) {
  console.log(
    `\n[evaluate] ===== NEW REQUEST ===== ${new Date().toISOString()} — ${memMB()}`
  );

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

  // ── Step 1: Identify user from session cookie ──────────────────────────────
  const sessionEmail = extractEmailFromCookie(request);
  const profileEmail = email && typeof email === "string" ? email : null;
  const resolvedEmail = sessionEmail || profileEmail;

  let isPremium = false;
  let user = null;

  if (resolvedEmail) {
    user = getOrCreateUser(resolvedEmail);
    isPremium = user.plan === "premium";

    // Usage limit for free users
    if (!isPremium && user.usage_count >= FREE_USAGE_LIMIT) {
      console.log(
        `[evaluate] FREE LIMIT REACHED — email=${resolvedEmail} usage_count=${user.usage_count}`
      );
      return Response.json(
        {
          error: "Free plan limit reached. Please upgrade to continue.",
          upgradeRequired: true,
          usage_count: user.usage_count,
          limit: FREE_USAGE_LIMIT,
        },
        { status: 403 }
      );
    }
  }

  console.log(
    `[evaluate] email=${resolvedEmail ?? "anonymous"} plan=${user?.plan ?? "none"} isPremium=${isPremium} usage=${user?.usage_count ?? 0}`
  );

  // ── Step 2: Run evaluation pipeline ───────────────────────────────────────
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
      `hybrid_score=${hybrid_analysis?.final_score ?? "n/a"}`
  );

  // ── Step 3: Lead capture ───────────────────────────────────────────────────
  const captureEmail = resolvedEmail || (profileEmail ?? null);
  if (captureEmail && validateEmail(captureEmail)) {
    captureLead({
      name: (name as string) || "Anonymous",
      email: captureEmail,
      score: result.overall_score,
      timestamp: new Date().toISOString(),
    }).catch(() => {});
  }

  // ── Step 4: Increment usage ────────────────────────────────────────────────
  if (resolvedEmail) {
    incrementUsage(resolvedEmail);
  }

  // ── Step 5: Return response based on plan ─────────────────────────────────
  if (!isPremium) {
    console.log(
      `[evaluate] FREE response — score=${hybrid_analysis?.final_score ?? result.overall_score}`
    );
    return Response.json(
      buildFreeResponse(
        result.overall_score,
        hybrid_analysis?.final_score,
        result.visa_probabilities as unknown as Record<string, number>
      )
    );
  }

  const fullResponse: Record<string, unknown> = {
    ...result,
    roadmap,
    rfe_predictions,
    approval_simulation,
    ...(hybrid_analysis ? { hybrid_analysis } : {}),
  };

  console.log(`[evaluate] PREMIUM response — fields: ${Object.keys(fullResponse).join(", ")}`);
  return Response.json(fullResponse);
}
