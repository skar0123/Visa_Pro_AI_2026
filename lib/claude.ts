/**
 * Optional Claude API wrapper.
 * If ANTHROPIC_API_KEY is set, uses Claude claude-sonnet-4-6 for richer analysis.
 * Falls back to the rule-based engine gracefully when the key is absent.
 */

import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

export function isClaudeAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export async function enrichAnalysisWithClaude(
  profile: { name: string; education: string; experience: string; skills: string },
  ruleBasedSummary: { overall_score: number; strengths: string[]; gaps: string[] }
): Promise<{ strengths: string[]; gaps: string[]; suggestions: string[] } | null> {
  const client = getClient();
  if (!client) return null;

  const prompt = `You are an experienced US immigration attorney specializing in EB-1A, EB-2 NIW, and O-1A extraordinary ability visa petitions.

A client has submitted the following professional profile:

EDUCATION:
${profile.education}

EXPERIENCE:
${profile.experience}

SKILLS:
${profile.skills}

A rule-based system has already computed an overall score of ${ruleBasedSummary.overall_score}/100.

Please provide a JSON response with exactly these three arrays:
1. "strengths": 4-6 attorney-style analysis strings identifying the strongest elements that support an extraordinary ability claim, referencing specific 8 C.F.R. criteria where applicable.
2. "gaps": 4-6 specific weaknesses that USCIS adjudicators would scrutinize, with CFR references.
3. "suggestions": 4-6 concrete, actionable steps the applicant should take in the next 12 months to strengthen their petition.

Keep each item to 2-4 sentences maximum. Be specific and cite actual regulatory standards.

Respond with only valid JSON in this format:
{"strengths": [...], "gaps": [...], "suggestions": [...]}`;

  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const text = msg.content[0].type === "text" ? msg.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (
      Array.isArray(parsed.strengths) &&
      Array.isArray(parsed.gaps) &&
      Array.isArray(parsed.suggestions)
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export async function generateInterviewQuestion(
  visaType: string,
  category: string,
  profile: { education: string; experience: string; skills: string },
  previousQuestions: string[]
): Promise<{ question: string; context: string } | null> {
  const client = getClient();
  if (!client) return null;

  const prompt = `You are a USCIS immigration officer conducting an interview for a ${visaType} visa petition.

The applicant's background:
- Education: ${profile.education.slice(0, 300)}
- Experience: ${profile.experience.slice(0, 300)}
- Skills: ${profile.skills.slice(0, 300)}

Category focus: ${category}

Previously asked questions (do not repeat):
${previousQuestions.slice(-3).join("\n") || "None yet"}

Generate ONE realistic interview question that a USCIS officer would ask for this category.
Also provide a brief "context" note (1 sentence) explaining what the officer is trying to assess.

Respond with only JSON: {"question": "...", "context": "..."}`;

  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    const text = msg.content[0].type === "text" ? msg.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

export async function enrichWithHybridContext(
  profile: { name: string; education: string; experience: string; skills: string },
  features: {
    awards_count: number;
    awards_tier: string;
    media_presence: boolean;
    judging_experience: boolean;
    original_contributions: boolean;
    authorship: boolean;
    leading_role: boolean;
    high_salary: boolean;
    memberships: boolean;
    exhibitions: boolean;
  },
  ragContext: string,
  mlScore: number,
  criteriaMet: string[],
  missingCriteria: string[]
): Promise<{
  explanation: string;
  improvement_suggestions: string[];
  confidence_level: "low" | "medium" | "high";
} | null> {
  const client = getClient();
  if (!client) return null;

  // Hard cap on each section to keep prompt size bounded
  const MAX_CONTEXT_CHARS = 1800;
  const MAX_PROFILE_CHARS = 500;

  const safeRagContext = ragContext.slice(0, MAX_CONTEXT_CHARS);
  const ragSection = safeRagContext
    ? `\n\nRELEVANT EB1A LEGAL CONTEXT (retrieved from knowledge base):\n${safeRagContext}\n\nUse the above retrieved information to ground your reasoning. Do not hallucinate beyond this.`
    : "";

  const prompt = `You are an experienced US immigration attorney specializing in EB-1A extraordinary ability visa petitions.
${ragSection}

CLIENT PROFILE:
Education: ${profile.education.slice(0, MAX_PROFILE_CHARS)}

Experience: ${profile.experience.slice(0, MAX_PROFILE_CHARS)}

Skills: ${profile.skills.slice(0, MAX_PROFILE_CHARS)}

ML MODEL OUTPUT:
- Predicted approval score: ${mlScore}/100
- Criteria satisfied (${criteriaMet.length} of 10): ${criteriaMet.join("; ") || "None detected"}
- Missing criteria: ${missingCriteria.join("; ") || "None"}

Based on the retrieved legal context, the client's profile, and the ML model output, provide a JSON response with:
1. "explanation": 3-5 sentences grounded in the retrieved EB1A criteria descriptions and the specific evidence in this profile. Reference CFR sections where relevant.
2. "improvement_suggestions": array of 4-6 specific, actionable steps (each 2-3 sentences) the applicant should take to address missing criteria, grounded in the retrieved legal context.
3. "confidence_level": "low" if score < 40, "medium" if 40-64, "high" if >= 65.

Respond with only valid JSON: {"explanation": "...", "improvement_suggestions": [...], "confidence_level": "low|medium|high"}`;

  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    });

    const text = msg.content[0].type === "text" ? msg.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (
      typeof parsed.explanation === "string" &&
      Array.isArray(parsed.improvement_suggestions) &&
      ["low", "medium", "high"].includes(parsed.confidence_level)
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export async function evaluateInterviewAnswer(
  question: string,
  answer: string,
  visaType: string
): Promise<{ score: number; feedback: string; suggestion: string } | null> {
  const client = getClient();
  if (!client) return null;

  const prompt = `You are an immigration attorney coaching a client on their ${visaType} visa interview.

The USCIS officer asked: "${question}"

The applicant answered: "${answer}"

Evaluate the answer on these dimensions:
1. Does it directly address the regulatory criterion the question targets?
2. Is it specific with evidence (dates, numbers, names) rather than vague?
3. Does it present the applicant compellingly without being boastful?

Provide:
- score: 1-10 (10 = attorney-approved, ready to submit)
- feedback: 2-3 sentences on what was strong and what was weak
- suggestion: 1-2 sentences on how to improve this specific answer

Respond with only JSON: {"score": N, "feedback": "...", "suggestion": "..."}`;

  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    });

    const text = msg.content[0].type === "text" ? msg.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}
