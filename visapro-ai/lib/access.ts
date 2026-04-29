export type Plan = "FREE" | "PRO" | "PREMIUM";

export type Feature =
  | "basic_evaluation"      // Overall score + limited insights (FREE+)
  | "full_evaluation"       // Complete AI analysis (PRO+)
  | "visa_probability"      // EB-1A / NIW / O-1A scoring (PRO+)
  | "gap_analysis"          // USCIS-style gap analysis (PRO+)
  | "roadmap"               // 12-month strategy roadmap (PRO+)
  | "rfe_predictor"         // RFE risk detection (PRO+)
  | "approval_simulation"   // Approval probability simulation (PRO+)
  | "pdf_basic"             // Basic print/export (PRO+)
  | "pdf_full"              // Detailed downloadable PDF report (PREMIUM)
  | "interview_simulator"   // AI interview practice (PREMIUM)
  | "petition_checklist"    // Attorney-grade petition checklist (PREMIUM)
  | "advanced_strategy";    // Deep case strategy insights (PREMIUM)

const ACCESS_MAP: Record<Plan, Feature[]> = {
  FREE: [
    "basic_evaluation",
  ],
  PRO: [
    "basic_evaluation",
    "full_evaluation",
    "visa_probability",
    "gap_analysis",
    "roadmap",
    "rfe_predictor",
    "approval_simulation",
    "pdf_basic",
  ],
  PREMIUM: [
    "basic_evaluation",
    "full_evaluation",
    "visa_probability",
    "gap_analysis",
    "roadmap",
    "rfe_predictor",
    "approval_simulation",
    "pdf_basic",
    "pdf_full",
    "interview_simulator",
    "petition_checklist",
    "advanced_strategy",
  ],
};

export function hasAccess(plan: Plan, feature: Feature): boolean {
  return ACCESS_MAP[plan]?.includes(feature) ?? false;
}

export const PLAN_LABELS: Record<Plan, string> = {
  FREE: "Free",
  PRO: "Pro",
  PREMIUM: "Premium",
};

/** Which plan first unlocks a given feature (for upgrade prompts). */
export const FEATURE_REQUIRED_PLAN: Record<Feature, Plan> = {
  basic_evaluation:    "FREE",
  full_evaluation:     "PRO",
  visa_probability:    "PRO",
  gap_analysis:        "PRO",
  roadmap:             "PRO",
  rfe_predictor:       "PRO",
  approval_simulation: "PRO",
  pdf_basic:           "PRO",
  pdf_full:            "PREMIUM",
  interview_simulator: "PREMIUM",
  petition_checklist:  "PREMIUM",
  advanced_strategy:   "PREMIUM",
};
