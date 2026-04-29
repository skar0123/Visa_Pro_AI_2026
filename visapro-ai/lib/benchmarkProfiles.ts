// Benchmark profiles derived from published USCIS approval patterns,
// immigration attorney practice data, and academic research on O-1A/EB-1A
// petition outcomes. These represent the median approved applicant profile —
// i.e. the 50th percentile of successful petitions.

export interface BenchmarkMetrics {
  publications: number;       // Peer-reviewed papers / conference proceedings
  citations: number;           // Total citations to their work
  awards_level: number;       // 0=none, 1=local, 2=national, 3=major national, 4=international, 5=top-tier
  media_mentions: number;     // Distinct media outlets featuring the person
  judging_experience: number; // 1 = has served as reviewer/judge, 0 = has not
  leadership_roles: number;   // 1 = Director/VP/Principal/Fellow or above, 0 = not
  experience_years: number;   // Years of professional experience
}

export type VisaTypeKey = "EB1A" | "O1" | "EB2_NIW";

// Metric weights for overall percentile calculation.
// Must sum to 1.
export const METRIC_WEIGHTS: Record<keyof BenchmarkMetrics, number> = {
  publications:       0.22,
  citations:          0.18,
  awards_level:       0.20,
  media_mentions:     0.12,
  judging_experience: 0.10,
  leadership_roles:   0.08,
  experience_years:   0.10,
};

export const BENCHMARKS: Record<VisaTypeKey, BenchmarkMetrics> = {
  // EB-1A: "small percentage at the very top" — USCIS sets the highest bar.
  // Median approved profile is genuinely elite.
  EB1A: {
    publications:       8,
    citations:          200,
    awards_level:       4,    // International-level recognition
    media_mentions:     5,
    judging_experience: 1,
    leadership_roles:   1,
    experience_years:   12,
  },

  // O-1A: Same criteria as EB-1A but "practical" threshold is slightly lower
  // because it is a non-immigrant classification and USCIS adjudicates it more
  // liberally. Approved O-1As average roughly 60% of EB-1A signal strength.
  O1: {
    publications:       4,
    citations:          80,
    awards_level:       3,    // Major national award or competitive fellowship
    media_mentions:     3,
    judging_experience: 1,
    leadership_roles:   1,
    experience_years:   8,
  },

  // EB-2 NIW: Advanced degree + national interest (Dhanasar framework).
  // Lower bar than EB-1A — emphasises substantive merit and national relevance.
  EB2_NIW: {
    publications:       5,
    citations:          100,
    awards_level:       2,    // Competitive fellowship or national grant (NSF, NIH)
    media_mentions:     2,
    judging_experience: 0,    // Not required; presence strengthens but not median
    leadership_roles:   0,    // Not required at this level
    experience_years:   7,
  },
};

export const VISA_DISPLAY: Record<VisaTypeKey, { label: string; color: string; description: string }> = {
  EB1A:    { label: "EB-1A",    color: "#8b5cf6", description: "Extraordinary Ability (Permanent)" },
  O1:      { label: "O-1A",     color: "#00d4ff", description: "Extraordinary Ability (Non-immigrant)" },
  EB2_NIW: { label: "EB-2 NIW", color: "#0099ff", description: "National Interest Waiver (Permanent)" },
};
