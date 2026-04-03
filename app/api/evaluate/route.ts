import { NextRequest } from "next/server";
import {
  evaluateProfile,
  generateRoadmap,
  generateRFEPredictions,
  computeApprovalSimulation,
  ProfileInput,
} from "@/lib/ai";

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

export async function POST(request: NextRequest) {
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

    // Background lead capture — does not block response
    if (email) {
      sendLeadToWebhook(name || "Anonymous", email, result.overall_score, education || "").catch(() => {});
    }

    return Response.json({ ...result, roadmap, rfe_predictions, approval_simulation });
  } catch {
    return Response.json(
      { error: "Failed to evaluate profile. Please try again." },
      { status: 500 }
    );
  }
}
