import { NextRequest, NextResponse } from "next/server";
import { generateInterviewQuestion, evaluateInterviewAnswer } from "@/lib/claude";

// Fallback question bank (used when Claude API is unavailable)
const QUESTION_BANK: Record<string, { question: string; context: string }[]> = {
  publications: [
    {
      question: "Can you describe your most significant published research and explain why other experts in your field have cited or built upon it?",
      context: "Assessing whether the applicant's scholarly output has had measurable influence beyond their own organization.",
    },
    {
      question: "How many peer-reviewed papers have you published, in what venues, and what citation counts have you accumulated?",
      context: "Verifying the quantity and quality of the applicant's scholarly contributions under 8 C.F.R. § 204.5(h)(3)(vi).",
    },
  ],
  awards: [
    {
      question: "Tell me about the most prestigious award or fellowship you have received. How competitive was it, and what criteria were used for selection?",
      context: "Verifying whether the award is nationally or internationally recognized under 8 C.F.R. § 204.5(h)(3)(i).",
    },
    {
      question: "What percentage of applicants received the award you mentioned, and can you provide documentation of the selection process?",
      context: "Establishing the exclusivity and prestige of the award relative to peers in the field.",
    },
  ],
  critical_role: [
    {
      question: "In what specific ways was your role critical to your organization's operations? What would have happened if you had not been in that position?",
      context: "Assessing whether the applicant performed in a truly critical capacity rather than a routine senior role under 8 C.F.R. § 204.5(h)(3)(viii).",
    },
    {
      question: "How does your organization rank in prominence within your industry? What evidence demonstrates its distinguished reputation?",
      context: "Verifying whether the employing organization qualifies as 'distinguished' in its field.",
    },
  ],
  salary: [
    {
      question: "How does your compensation compare to others with similar roles and experience in your geographic area? Can you provide documentation?",
      context: "Evaluating the high salary criterion under 8 C.F.R. § 204.5(h)(3)(ix).",
    },
    {
      question: "What is your total compensation including equity and bonuses, and what percentile does that place you in for your occupation?",
      context: "Establishing market-relative compensation as evidence of extraordinary recognition.",
    },
  ],
  media: [
    {
      question: "Has your work been featured or discussed in any trade publications, newspapers, or media outlets? Can you describe those instances?",
      context: "Verifying published material about the petitioner under 8 C.F.R. § 204.5(h)(3)(iii).",
    },
    {
      question: "Have you delivered keynote addresses or invited talks at major conferences? Which conferences, and how were you selected?",
      context: "Assessing whether the applicant's expertise is publicly recognized at the national or international level.",
    },
  ],
  judging: [
    {
      question: "Have you served as a peer reviewer for academic journals or conference program committees? Please provide specific examples and volume.",
      context: "Verifying participation as a judge of others' work under 8 C.F.R. § 204.5(h)(3)(iv).",
    },
    {
      question: "Have you been invited to evaluate grant applications, serve on advisory boards, or assess the work of other experts in your field?",
      context: "Establishing that peers recognize the applicant as having sufficient expertise to evaluate others' work.",
    },
  ],
  extraordinary: [
    {
      question: "In your own assessment, what places you in the top percentage of professionals in your field? What evidence would you present to support that?",
      context: "Gauging the applicant's self-awareness of the extraordinary ability standard and their evidentiary record.",
    },
    {
      question: "Why should an immigration officer consider you to have 'extraordinary ability' rather than simply excellent qualifications?",
      context: "Testing whether the applicant understands and can articulate the legal distinction between 'extraordinary' and 'highly skilled'.",
    },
  ],
};

const CATEGORIES = Object.keys(QUESTION_BANK);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, visaType, category, profile, previousQuestions, question, answer } = body;

    if (action === "get_question") {
      // Try Claude first
      const claudeResult = await generateInterviewQuestion(
        visaType || "O-1A",
        category || "extraordinary",
        profile || { education: "", experience: "", skills: "" },
        previousQuestions || []
      );

      if (claudeResult) {
        return NextResponse.json({ ...claudeResult, source: "claude" });
      }

      // Fallback to question bank
      const cat = CATEGORIES.includes(category) ? category : CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
      const pool = QUESTION_BANK[cat];
      const used = (previousQuestions || []) as string[];
      const available = pool.filter((q) => !used.includes(q.question));
      const chosen = available.length > 0
        ? available[Math.floor(Math.random() * available.length)]
        : pool[Math.floor(Math.random() * pool.length)];

      return NextResponse.json({ ...chosen, source: "fallback" });
    }

    if (action === "evaluate_answer") {
      if (!question || !answer) {
        return NextResponse.json({ error: "Missing question or answer" }, { status: 400 });
      }

      const claudeResult = await evaluateInterviewAnswer(question, answer, visaType || "O-1A");
      if (claudeResult) {
        return NextResponse.json({ ...claudeResult, source: "claude" });
      }

      // Rule-based fallback evaluation
      const wordCount = answer.trim().split(/\s+/).length;
      const hasSpecifics = /\d/.test(answer); // numbers are good
      const hasCFR = /c\.f\.r|uscis|8 cfr/i.test(answer);
      const isVague = wordCount < 20;
      const isTooLong = wordCount > 200;

      let score = 5;
      if (hasSpecifics) score += 2;
      if (hasCFR) score += 1;
      if (isVague) score -= 2;
      if (isTooLong) score -= 1;
      score = Math.max(1, Math.min(10, score));

      const feedback = isVague
        ? "Your answer is too brief. USCIS officers expect specific, evidence-backed responses with dates, numbers, and named accomplishments."
        : hasSpecifics
        ? "Good use of specific details. Ensure you also explain the significance of those accomplishments relative to peers in your field."
        : "Your answer is adequately detailed but lacks specific quantitative evidence. Add numbers, dates, and named institutions to strengthen your response.";

      const suggestion = "Focus on the 'so what' — not just what you did, but why it matters to others in the field and how it demonstrates you are among the top professionals in your area.";

      return NextResponse.json({ score, feedback, suggestion, source: "fallback" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("interview route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
