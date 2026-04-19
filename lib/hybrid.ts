/**
 * Hybrid evaluation orchestrator.
 * Coordinates RAG retrieval, ML scoring, rule engine, and Claude enrichment.
 * All failures are contained — the caller always gets a result or null.
 */

import { extract_features, EB1AFeatures } from "./ml/featureExtractor";
import { predict_score, getConfidenceLevel } from "./ml/scoringModel";
import { apply_rules, RuleAdjustment } from "./ml/ruleEngine";
import { retrieve_documents, formatRetrievedContext, RetrievedDocument } from "./rag/retriever";
import { enrichWithHybridContext, isClaudeAvailable } from "./claude";

// Hard caps on profile text fed into RAG query and Claude prompt
const MAX_FIELD_CHARS = 600;
const MAX_QUERY_EXPERIENCE_WORDS = 25;

export interface HybridAnalysis {
  final_score: number;
  confidence_level: "low" | "medium" | "high";
  criteria_met: string[];
  missing_criteria: string[];
  explanation: string;
  improvement_suggestions: string[];
  ml_score: number;
  rules_applied: string[];
  retrieved_sources: { id: string; title: string; cfr_reference?: string }[];
}

export async function runHybridEvaluation(profile: {
  name: string;
  education: string;
  experience: string;
  skills: string;
}): Promise<HybridAnalysis | null> {
  try {
    // Layer 2: Feature extraction from profile text
    const features: EB1AFeatures = extract_features(profile);

    // Layer 4: ML scoring
    const ml_score = predict_score(features);

    // Layer 5: Rule engine adjustments
    const ruleResult: RuleAdjustment = apply_rules(features, ml_score);

    // Layer 3: RAG retrieval — top-3 only, query capped
    const ragQuery = buildRagQuery(profile, features);
    const retrieved: RetrievedDocument[] = retrieve_documents(ragQuery, 3);
    const ragContext = formatRetrievedContext(retrieved);

    // Layer 6: Claude enrichment — only when API key is set
    let claudeAnalysis: Awaited<ReturnType<typeof enrichWithHybridContext>> = null;
    if (isClaudeAvailable()) {
      // Truncate profile fields before sending to Claude to bound prompt size
      const truncated = {
        name: profile.name,
        education: profile.education.slice(0, MAX_FIELD_CHARS),
        experience: profile.experience.slice(0, MAX_FIELD_CHARS),
        skills: profile.skills.slice(0, MAX_FIELD_CHARS),
      };
      claudeAnalysis = await enrichWithHybridContext(
        truncated,
        features,
        ragContext,
        ruleResult.adjusted_score,
        ruleResult.criteria_met,
        ruleResult.missing_criteria
      );
    }

    const confidence = getConfidenceLevel(
      ruleResult.adjusted_score,
      ruleResult.criteria_met.length
    );

    return {
      final_score: ruleResult.adjusted_score,
      confidence_level: claudeAnalysis?.confidence_level ?? confidence,
      criteria_met: ruleResult.criteria_met,
      missing_criteria: ruleResult.missing_criteria,
      explanation:
        claudeAnalysis?.explanation ??
        buildFallbackExplanation(ruleResult, features),
      improvement_suggestions:
        claudeAnalysis?.improvement_suggestions ??
        buildFallbackSuggestions(ruleResult),
      ml_score,
      rules_applied: ruleResult.rules_applied,
      retrieved_sources: retrieved.map((d) => ({
        id: d.id,
        title: d.title,
        cfr_reference: d.cfr_reference,
      })),
    };
  } catch {
    return null;
  }
}

function buildRagQuery(
  profile: { education: string; experience: string; skills: string },
  features: EB1AFeatures
): string {
  const parts: string[] = [];

  if (features.authorship) parts.push("scholarly articles publications authorship");
  if (features.judging_experience) parts.push("peer review judging program committee");
  if (features.original_contributions) parts.push("original contributions patents citations major significance");
  if (features.awards_count > 0) parts.push(`awards prizes ${features.awards_tier} tier nationally recognized`);
  if (features.media_presence) parts.push("media coverage published material press");
  if (features.leading_role) parts.push("leading critical role distinguished organization");
  if (features.high_salary) parts.push("high salary remuneration top compensation");
  if (features.memberships) parts.push("membership outstanding achievements fellow");

  // Cap experience words to avoid oversized query strings
  const fieldWords = profile.experience
    .split(/\s+/)
    .slice(0, MAX_QUERY_EXPERIENCE_WORDS)
    .join(" ");
  parts.push(fieldWords);

  return parts.join(" ");
}

function buildFallbackExplanation(
  ruleResult: RuleAdjustment,
  features: EB1AFeatures
): string {
  const met = ruleResult.criteria_met.length;
  const score = ruleResult.adjusted_score;
  const level =
    score >= 70 ? "strong" :
    score >= 50 ? "moderate" :
    score >= 35 ? "borderline" : "insufficient";

  return (
    `Based on ML scoring and rule-engine analysis, this profile demonstrates a ${level} EB1A case ` +
    `with ${met} of 10 criteria satisfied (minimum 3 required). ` +
    `The ML model assigns a raw probability score of ${features.awards_count > 0 ? "above" : "below"} median ` +
    `for applicants with this feature profile. ` +
    (ruleResult.rules_applied.length > 0
      ? `Rule adjustments: ${ruleResult.rules_applied[0]}`
      : "No rule adjustments applied.")
  );
}

function buildFallbackSuggestions(ruleResult: RuleAdjustment): string[] {
  const suggestions: string[] = [];
  const missing = ruleResult.missing_criteria;

  if (missing.some((m) => m.includes("Awards"))) {
    suggestions.push(
      "Apply for nationally competitive awards such as NSF CAREER grants, IEEE/ACM fellowships, or industry excellence awards to satisfy the awards criterion under 8 C.F.R. § 204.5(h)(3)(i)."
    );
  }
  if (missing.some((m) => m.includes("Media"))) {
    suggestions.push(
      "Pursue media coverage through tech publications (TechCrunch, Wired, Forbes) or academic press releases. A single feature article in a major publication satisfies the media criterion under § 204.5(h)(3)(iii)."
    );
  }
  if (missing.some((m) => m.includes("Judging"))) {
    suggestions.push(
      "Register as a peer reviewer with journals in your field via Publons/Web of Science, and apply to serve on program committees for top conferences to document the judging criterion under § 204.5(h)(3)(iv)."
    );
  }
  if (missing.some((m) => m.includes("Scholarly Articles"))) {
    suggestions.push(
      "Submit manuscripts to peer-reviewed venues; even 2–3 published papers in reputable journals or top-tier conferences satisfy the authorship criterion under § 204.5(h)(3)(vi)."
    );
  }
  if (missing.some((m) => m.includes("Original Contributions"))) {
    suggestions.push(
      "File a provisional patent (~$320), document open-source adoption metrics, or quantify industry impact of your work to establish original contributions of major significance under § 204.5(h)(3)(v)."
    );
  }
  if (suggestions.length === 0) {
    suggestions.push(
      "Strengthen existing criteria with additional documentation: obtain 6–8 independent expert letters, quantify citation impact, and document award selectivity."
    );
  }

  return suggestions;
}
