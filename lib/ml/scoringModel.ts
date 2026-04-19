/**
 * Logistic regression scoring model for EB1A approval probability.
 *
 * Weights are calibrated from domain knowledge to reflect USCIS adjudication
 * patterns. The feature vector maps each EB1A criterion to a numeric input.
 * Output is scaled to 0–100.
 *
 * Weight calibration rationale:
 *   - Intercept anchors baseline near 15% (most applicants don't qualify)
 *   - Judging/contributions/authorship carry highest weight (USCIS scrutinizes these most)
 *   - Awards tier encoded as one-hot to capture prestige non-linearly
 *   - awards_count contributes sub-linearly via log scaling
 */

import { EB1AFeatures } from "./featureExtractor";

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

// Weights: [intercept, awards_count_log, awards_low, awards_med, awards_high,
//           media, judging, contributions, authorship, leading_role,
//           high_salary, memberships, exhibitions]
const WEIGHTS = {
  intercept: -2.8,
  awards_count_log: 0.35,
  awards_low: 0.3,
  awards_medium: 0.9,
  awards_high: 2.1,
  media_presence: 1.5,
  judging_experience: 1.8,
  original_contributions: 1.7,
  authorship: 1.5,
  leading_role: 1.2,
  high_salary: 1.1,
  memberships: 1.6,
  exhibitions: 0.7,
};

function featureVector(f: EB1AFeatures): Record<string, number> {
  return {
    intercept: 1,
    awards_count_log: Math.log1p(f.awards_count),
    awards_low: f.awards_tier === "low" && f.awards_count > 0 ? 1 : 0,
    awards_medium: f.awards_tier === "medium" ? 1 : 0,
    awards_high: f.awards_tier === "high" ? 1 : 0,
    media_presence: f.media_presence ? 1 : 0,
    judging_experience: f.judging_experience ? 1 : 0,
    original_contributions: f.original_contributions ? 1 : 0,
    authorship: f.authorship ? 1 : 0,
    leading_role: f.leading_role ? 1 : 0,
    high_salary: f.high_salary ? 1 : 0,
    memberships: f.memberships ? 1 : 0,
    exhibitions: f.exhibitions ? 1 : 0,
  };
}

export function predict_score(features: EB1AFeatures): number {
  const fv = featureVector(features);
  let logit = 0;
  for (const [key, weight] of Object.entries(WEIGHTS)) {
    logit += weight * (fv[key] ?? 0);
  }
  // Sigmoid maps to (0, 1); scale to 0–100
  const raw = sigmoid(logit) * 100;
  // Clamp to realistic range
  return Math.round(Math.min(Math.max(raw, 5), 97));
}

export function getConfidenceLevel(
  score: number,
  criteria_met: number
): "low" | "medium" | "high" {
  if (criteria_met < 3 || score < 35) return "low";
  if (score >= 65 && criteria_met >= 5) return "high";
  return "medium";
}
