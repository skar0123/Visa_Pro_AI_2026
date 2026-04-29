import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { analyzeProfile, ProfileData } from "@/lib/profile-forge";

let _client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, education, workExperience, achievements, publications } = body as {
      name?: string;
      email?: string;
      education?: string;
      workExperience?: string;
      achievements?: string;
      publications?: string;
    };

    if (!education?.trim() && !workExperience?.trim() && !achievements?.trim()) {
      return NextResponse.json(
        { error: "Please fill in at least one section before analyzing." },
        { status: 400 }
      );
    }

    const profileData: ProfileData = {
      name: name ?? "",
      email: email ?? "",
      education: education ?? "",
      workExperience: workExperience ?? "",
      achievements: achievements ?? "",
      publications: publications ?? "",
    };

    // Step 1: Rule-based scoring
    const scores = analyzeProfile(profileData);

    // Step 2: Claude AI enrichment
    const client = getClient();
    let aiAnalysis = null;

    if (client) {
      const prompt = `You are a senior US immigration attorney specializing in EB-1 extraordinary ability visa petitions.

A client has submitted their immigration profile for EB-1 level evaluation:

EDUCATION:
${education || "Not provided"}

WORK EXPERIENCE:
${workExperience || "Not provided"}

ACHIEVEMENTS:
${achievements || "Not provided"}

PUBLICATIONS / AWARDS:
${publications || "Not provided"}

Rule-based system scores:
- Leadership Score: ${scores.leadership_score}/100
- Impact Score: ${scores.impact_score}/100
- Research Score: ${scores.research_score}/100
- Overall Score: ${scores.overall_score}/100

Convert this user profile into strong EB1-level achievements and highlight missing gaps.

Respond with ONLY valid JSON in exactly this format — no markdown, no commentary:
{
  "rewritten_profile": [
    "EB-1 strength statement 1 with specific evidence and regulatory criterion reference",
    "EB-1 strength statement 2",
    "EB-1 strength statement 3",
    "EB-1 strength statement 4",
    "EB-1 strength statement 5"
  ],
  "improvement_suggestions": [
    "Actionable improvement 1 with timeline",
    "Actionable improvement 2 with timeline",
    "Actionable improvement 3 with timeline",
    "Actionable improvement 4 with timeline"
  ],
  "gap_analysis": [
    { "area": "Publications & Research", "status": "missing|weak|strong", "description": "1–2 sentence assessment" },
    { "area": "Awards & Recognition", "status": "missing|weak|strong", "description": "1–2 sentence assessment" },
    { "area": "High Salary Evidence", "status": "missing|weak|strong", "description": "1–2 sentence assessment" },
    { "area": "Critical Role", "status": "missing|weak|strong", "description": "1–2 sentence assessment" },
    { "area": "Judging Others' Work", "status": "missing|weak|strong", "description": "1–2 sentence assessment" },
    { "area": "Media Coverage", "status": "missing|weak|strong", "description": "1–2 sentence assessment" }
  ]
}`;

      try {
        const msg = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 1800,
          messages: [{ role: "user", content: prompt }],
        });

        const text = msg.content[0].type === "text" ? msg.content[0].text : "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (
            Array.isArray(parsed.rewritten_profile) &&
            Array.isArray(parsed.improvement_suggestions) &&
            Array.isArray(parsed.gap_analysis)
          ) {
            aiAnalysis = parsed;
          }
        }
      } catch {
        // Fall through to default
      }
    }

    // Fallback if Claude unavailable or parse failed
    if (!aiAnalysis) {
      const hasPubs = !!publications?.trim();
      const hasWork = !!workExperience?.trim();
      const hasAch = !!achievements?.trim();

      aiAnalysis = {
        rewritten_profile: [
          "Demonstrated extraordinary ability through sustained national and international recognition in field of expertise, meeting the high standard required under 8 C.F.R. § 204.5(h)(3).",
          "Held a critical role within distinguished organizations, with responsibilities and scope of impact significantly exceeding those of peers at comparable career stages.",
          "Contributed original contributions of major significance — including development of techniques, systems, or methodologies adopted by others in the field.",
          "Commanded high remuneration relative to others in the occupation, evidencing recognition of exceptional talent by employers in a competitive market.",
          "Participated in judging the work of others, including peer review, evaluation panels, or technical assessment — establishing standing as a recognized expert.",
        ],
        improvement_suggestions: [
          "Obtain 3–5 reference letters from independent experts who can attest to your extraordinary ability and national/international recognition — prioritize individuals who have not employed you.",
          "Quantify every achievement with hard metrics: revenue generated, users impacted, citations received, percentile ranking. Adjudicators require evidence, not assertions.",
          "Build a peer review or judging record by volunteering for conference program committees, journal review panels, or award selection committees within the next 6 months.",
          "Document press coverage, speaking invitations, and industry recognition — even trade publications and podcasts count toward 8 C.F.R. § 204.5(h)(3)(iii).",
        ],
        gap_analysis: [
          {
            area: "Publications & Research",
            status: hasPubs ? "weak" : "missing",
            description: hasPubs
              ? "Publications are present but peer-reviewed venue documentation is needed. Obtain citation counts and h-index data."
              : "No publications listed. This is among the strongest EB-1 criteria — begin submitting to peer-reviewed venues immediately.",
          },
          {
            area: "Awards & Recognition",
            status: hasAch ? "weak" : "missing",
            description: hasAch
              ? "Achievements are present but need formal recognition framing. Obtain award letters and document prize significance."
              : "No awards listed. Identify industry competitions, fellowship programs, or professional honors to pursue within 12 months.",
          },
          {
            area: "High Salary Evidence",
            status: "weak",
            description:
              "Salary data not provided. Gather offer letters, W-2s, or pay stubs. Compare to BLS or Glassdoor data for your role and geography.",
          },
          {
            area: "Critical Role",
            status: hasWork ? "strong" : "missing",
            description: hasWork
              ? "Work history demonstrates leadership positions. Strengthen with org charts and employer letters attesting to the critical nature of your role."
              : "No work experience provided. A critical role at a distinguished organization is a primary EB-1 criterion.",
          },
          {
            area: "Judging Others' Work",
            status: "missing",
            description:
              "No evidence of peer review, judging, or evaluation committees. This criterion is easy to satisfy: volunteer for one technical review panel in the next 90 days.",
          },
          {
            area: "Media Coverage",
            status: "missing",
            description:
              "No press coverage documented. Engage PR efforts targeting trade media in your industry — even niche publications satisfy this criterion.",
          },
        ],
      };
    }

    return NextResponse.json({ scores, aiAnalysis });
  } catch (err) {
    console.error("[profile-forge] Error:", err);
    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}
