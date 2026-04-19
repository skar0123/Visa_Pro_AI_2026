import { EB1AFeatures, countCriteriaMet } from "./featureExtractor";

export interface RuleAdjustment {
  adjusted_score: number;
  rules_applied: string[];
  criteria_met: string[];
  missing_criteria: string[];
}

const CRITERIA_LABELS: Record<keyof EB1AFeatures, string> = {
  awards_count: "Nationally/Internationally Recognized Awards (§204.5(h)(3)(i))",
  awards_tier: "",
  media_presence: "Published Media Coverage (§204.5(h)(3)(iii))",
  judging_experience: "Judging the Work of Others (§204.5(h)(3)(iv))",
  original_contributions: "Original Contributions of Major Significance (§204.5(h)(3)(v))",
  authorship: "Authorship of Scholarly Articles (§204.5(h)(3)(vi))",
  leading_role: "Leading/Critical Role at Distinguished Organization (§204.5(h)(3)(viii))",
  high_salary: "High Salary or Remuneration (§204.5(h)(3)(ix))",
  memberships: "Membership Requiring Outstanding Achievements (§204.5(h)(3)(ii))",
  exhibitions: "Display of Work at Artistic Exhibitions (§204.5(h)(3)(vii))",
};

export function apply_rules(
  features: EB1AFeatures,
  ml_score: number
): RuleAdjustment {
  let score = ml_score;
  const rules_applied: string[] = [];
  const criteria_met: string[] = [];
  const missing_criteria: string[] = [];

  // Build criteria met/missing lists
  if (features.awards_count > 0) {
    criteria_met.push(CRITERIA_LABELS.awards_count);
  } else {
    missing_criteria.push(CRITERIA_LABELS.awards_count);
  }

  const booleanCriteria: Array<keyof EB1AFeatures> = [
    "memberships",
    "media_presence",
    "judging_experience",
    "original_contributions",
    "authorship",
    "leading_role",
    "high_salary",
    "exhibitions",
  ];

  for (const key of booleanCriteria) {
    const label = CRITERIA_LABELS[key];
    if (!label) continue;
    if (features[key]) {
      criteria_met.push(label);
    } else {
      missing_criteria.push(label);
    }
  }

  const num_criteria = countCriteriaMet(features);

  // Rule 1: Hard cap if fewer than 3 criteria met (USCIS minimum)
  if (num_criteria < 3) {
    const capped = Math.min(score, 40);
    if (capped < score) {
      rules_applied.push(
        `Hard cap applied: only ${num_criteria} criteria met (minimum 3 required). Score capped at 40.`
      );
      score = capped;
    }
  }

  // Rule 2: Boost for high-tier awards + media (strong corroboration)
  if (features.awards_tier === "high" && features.media_presence) {
    score = Math.min(score + 8, 97);
    rules_applied.push(
      "Boost: High-tier award AND media presence — two strong corroborating criteria (+8)."
    );
  }

  // Rule 3: Boost for judging + authorship (academic credibility stack)
  if (features.judging_experience && features.authorship) {
    score = Math.min(score + 5, 97);
    rules_applied.push(
      "Boost: Peer review/judging combined with scholarly authorship (+5)."
    );
  }

  // Rule 4: Boost for memberships (hard criterion to fake)
  if (features.memberships) {
    score = Math.min(score + 4, 97);
    rules_applied.push(
      "Boost: Prestigious fellowship/membership requiring outstanding achievement (+4)."
    );
  }

  // Rule 5: Penalty if no authorship and no original contributions (core EB1A weakness)
  if (!features.authorship && !features.original_contributions) {
    score = Math.max(score - 12, 5);
    rules_applied.push(
      "Penalty: No evidence of scholarly authorship or original contributions of major significance (-12)."
    );
  }

  // Rule 6: Penalty if no judging and no media (visibility gap)
  if (!features.judging_experience && !features.media_presence) {
    score = Math.max(score - 7, 5);
    rules_applied.push(
      "Penalty: No peer review/judging activity and no media coverage — visibility gap (-7)."
    );
  }

  // Rule 7: Boost for 6+ criteria (strong overall profile)
  if (num_criteria >= 6) {
    score = Math.min(score + 6, 97);
    rules_applied.push(
      `Boost: ${num_criteria} criteria satisfied — strong multi-criterion showing (+6).`
    );
  }

  // Rule 8: Boost for original contributions (hardest criterion, highest signal)
  if (features.original_contributions && features.authorship && features.judging_experience) {
    score = Math.min(score + 5, 97);
    rules_applied.push(
      "Boost: Trifecta of contributions + authorship + peer review — high scholarly credibility (+5)."
    );
  }

  return {
    adjusted_score: Math.round(score),
    rules_applied,
    criteria_met,
    missing_criteria,
  };
}
