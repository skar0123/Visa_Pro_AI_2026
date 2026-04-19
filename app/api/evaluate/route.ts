import { NextRequest } from "next/server";
import {
  evaluateProfile,
  generateRoadmap,
  generateRFEPredictions,
  computeApprovalSimulation,
  ProfileInput,
} from "@/lib/ai";
import { runHybridEvaluation } from "@/lib/hybrid";

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
    // Fire-and-forget — never break main flow
  }
}

function memMB(): string {
  const m = process.memoryUsage();
  return `rss=${Math.round(m.rss / 1048576)}MB heapUsed=${Math.round(m.heapUsed / 1048576)}MB heapTotal=${Math.round(m.heapTotal / 1048576)}MB`;
}

export async function POST(request: NextRequest) {
  console.log(`[evaluate] request start — ${memMB()}`);

  try {
    const body = await request.json();
    const { name, email, education, experience, skills } = body as ProfileInput & { email?: string };

    if (!education && !experience && !skills) {
      return Response.json(
        { error: "At least one profile field is required." },
        { status: 400 }
      );
    }

    const input: ProfileInput = {
      name: name || "Applicant",
      education: education || "",
      experience: experience || "",
      skills: skills || "",
    };

    const result = evaluateProfile(input);
    const roadmap = generateRoadmap(input, result);
    const rfe_predictions = generateRFEPredictions(input, result);
    const approval_simulation = computeApprovalSimulation(input, result);

    // Hybrid AI layer: RAG + ML + enhanced Claude reasoning (non-blocking)
    const hybrid_analysis = await runHybridEvaluation(input).catch(() => null);

    // Lean summary log — never serialise the full response object
    console.log(
      `HYBRID RUNNING — score=${hybrid_analysis?.final_score ?? "n/a"} ` +
      `confidence=${hybrid_analysis?.confidence_level ?? "n/a"} ` +
      `criteria=${hybrid_analysis?.criteria_met?.length ?? 0} ` +
      `sources=${hybrid_analysis?.retrieved_sources?.length ?? 0} — ${memMB()}`
    );

    // Background lead capture — does not block response
    if (email) {
      sendLeadToWebhook(name || "Anonymous", email, result.overall_score, education || "").catch(() => {});
    }

    return Response.json({
      ...result,
      roadmap,
      rfe_predictions,
      approval_simulation,
      ...(hybrid_analysis ? { hybrid_analysis } : {}),
    });
  } catch {
    console.error(`[evaluate] unhandled error — ${memMB()}`);
    return Response.json(
      { error: "Failed to evaluate profile. Please try again." },
      { status: 500 }
    );
  }
}
