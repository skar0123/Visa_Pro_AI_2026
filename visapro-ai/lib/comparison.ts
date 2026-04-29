import {
  BENCHMARKS,
  METRIC_WEIGHTS,
  type BenchmarkMetrics,
  type VisaTypeKey,
} from "@/lib/benchmarkProfiles";

// ─── Metric Extraction ────────────────────────────────────────────────────────

function extractPublications(text: string): number {
  // Explicit count patterns: "published 8 papers", "8 peer-reviewed publications"
  const patterns = [
    /(\d+)\s*(?:peer[-\s]?reviewed\s+)?(?:papers?|publications?|articles?|manuscripts?|studies)\b/i,
    /(?:published|authored|co-authored)\s+(\d+)\s*(?:papers?|publications?|articles?)/i,
    /(\d+)\s*(?:published|peer-reviewed)\s+(?:papers?|works?|articles?)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return Math.min(parseInt(m[1], 10), 100);
  }
  // Presence without count
  if (/\bpublication\b|\bpublished\b|\bpaper\b|\bauthored\b|\bco-authored\b|\barxiv\b|\bproceedings\b/i.test(text)) {
    return 2; // Implied presence, assume minimal
  }
  return 0;
}

function extractCitations(text: string): number {
  const citationPatterns = [
    /(\d+)\+?\s*citations?/i,
    /cited\s+(\d+)\+?\s*times?/i,
    /(\d[\d,]*)\s+total\s+citations?/i,
  ];
  for (const p of citationPatterns) {
    const m = text.match(p);
    if (m) return parseInt(m[1].replace(/,/g, ""), 10);
  }
  // h-index → rough citation estimate (h² approximation)
  const hIdx = text.match(/h[-\s]?index\s*(?:of|:)?\s*(\d+)/i);
  if (hIdx) return Math.pow(parseInt(hIdx[1], 10), 2);
  // Presence of citation keywords without count
  if (/\bcitation\b|\bcited\b|\bh-index\b|\bscholar\b/i.test(text)) return 30;
  return 0;
}

function extractAwardsLevel(text: string): number {
  const t = text.toLowerCase();
  // Level 5: Nobel, Fields, Turing, Breakthrough, top-tier
  if (/nobel|fields medal|turing award|breakthrough prize/i.test(t)) return 5;
  // Level 4: International named award or major global recognition
  if (/international.*award|global.*award|world.*prize|ieee fellow|acm fellow|national academy|elected.*member.*academy/i.test(t)) return 4;
  // Level 3: Major national (NSF CAREER, NIH R01, named fellowship, industry top prize)
  if (/nsf career|nih r01|darpa|sloan|simons|macarthur|presidential award|national science foundation award|competitive fellowship|national prize/i.test(t)) return 3;
  // Level 2: Competitive fellowship, grant, or recognized industry award
  if (/fellowship|grant|award|prize|recognition|winner|finalist|medal|honor|scholarship\b(?!.*just)/i.test(t)) return 2;
  // Level 1: Any mention of recognition
  if (/recognized|honored|recipient|distinction|achievement\saward/i.test(t)) return 1;
  return 0;
}

function extractMediaMentions(text: string): number {
  const outlets = [
    "forbes", "techcrunch", "wired", "bloomberg", "wall street journal", "wsj",
    "new york times", "nyt", "washington post", "guardian", "bbc", "cnn",
    "reuters", "financial times", "mit technology review", "nature news",
    "science news", "ieee spectrum", "ars technica", "verge", "axios",
    "business insider", "fast company", "inc magazine", "time magazine",
  ];
  const t = text.toLowerCase();
  let count = outlets.filter((o) => t.includes(o)).length;
  // Generic media signals if no named outlet
  if (count === 0 && /\bfeatured\b|\bpress\b|\bcoverage\b|\bmedia\b|\bnews\b.*mention|\binterview\b.*publish|\bprofiled\b/i.test(t)) {
    count = 1;
  }
  // Keynote/talk signals (public visibility)
  const talks = (t.match(/\bkeynote\b|\bted talk\b|\binvited talk\b|\bpublic lecture\b/g) || []).length;
  return Math.min(count + Math.floor(talks / 2), 20);
}

function extractJudgingExperience(text: string): number {
  return /\bjudge\b|\breviewer\b|\beditorial board\b|\bprogram committee\b|\bpeer review\b|\bgrant reviewer\b|\bnsf reviewer\b|\bnih reviewer\b|\bpanel\b/i.test(text) ? 1 : 0;
}

function extractLeadershipRoles(text: string): number {
  return /\bdirector\b|\bvp\b|\bvice president\b|\bchief\b|\bcto\b|\bceo\b|\bcoo\b|\bprincipal engineer\b|\bdistinguished\b|\bfellow\b|\bhead of\b|\bfounding\b|\bco-founder\b|\bfounder\b/i.test(text) ? 1 : 0;
}

function extractExperienceYears(text: string): number {
  const patterns = [
    /(\d+)\+?\s*years?\s+of\s+(?:professional\s+)?experience/i,
    /(\d+)\+?\s*years?\s+(?:in|at|with|working)/i,
    /over\s+(\d+)\s+years?/i,
    /(\d+)\+?\s*yrs?\b/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return Math.min(parseInt(m[1], 10), 40);
  }
  // Infer from date ranges: count distinct years mentioned
  const years = text.match(/\b(19|20)\d{2}\b/g);
  if (years && years.length >= 2) {
    const sorted = years.map(Number).sort((a, b) => a - b);
    return Math.min(sorted[sorted.length - 1] - sorted[0], 40);
  }
  return 0;
}

export function extractMetrics(profile: {
  education: string;
  experience: string;
  skills: string;
}): BenchmarkMetrics {
  const full = [profile.education, profile.experience, profile.skills].join("\n");
  return {
    publications:       extractPublications(full),
    citations:          extractCitations(full),
    awards_level:       extractAwardsLevel(full),
    media_mentions:     extractMediaMentions(full),
    judging_experience: extractJudgingExperience(full),
    leadership_roles:   extractLeadershipRoles(full),
    experience_years:   extractExperienceYears(full),
  };
}

// ─── Gap Calculation ──────────────────────────────────────────────────────────

export type MetricGaps = Record<keyof BenchmarkMetrics, number>;

export function compareProfile(
  user: BenchmarkMetrics,
  benchmark: BenchmarkMetrics
): MetricGaps {
  return {
    publications:       user.publications       - benchmark.publications,
    citations:          user.citations          - benchmark.citations,
    awards_level:       user.awards_level       - benchmark.awards_level,
    media_mentions:     user.media_mentions     - benchmark.media_mentions,
    judging_experience: user.judging_experience - benchmark.judging_experience,
    leadership_roles:   user.leadership_roles   - benchmark.leadership_roles,
    experience_years:   user.experience_years   - benchmark.experience_years,
  };
}

// ─── Percentile Calculation ───────────────────────────────────────────────────

/**
 * Map a single metric's user/benchmark ratio to a 0–100 percentile.
 * The benchmark value represents the 50th percentile of approved cases.
 * Uses a power function (concave) so gains above benchmark are harder to earn.
 *
 * ratio 0.00 → ~5th percentile
 * ratio 0.50 → ~36th percentile
 * ratio 1.00 → 50th percentile
 * ratio 1.50 → ~61st percentile
 * ratio 2.00 → ~71st percentile
 * ratio 3.00 → ~87th percentile
 */
function metricPercentile(userVal: number, benchmarkVal: number, isBinary: boolean): number {
  if (isBinary) {
    // Binary metrics: 0 → 25th, 1 → 75th (benchmark always requires it)
    return userVal >= 1 ? 75 : 25;
  }
  if (benchmarkVal === 0) return userVal > 0 ? 75 : 50;
  const ratio = userVal / benchmarkVal;
  const p = 50 * Math.pow(ratio, 0.55);
  return Math.max(5, Math.min(95, Math.round(p)));
}

export interface PercentileBreakdown {
  overall: number;
  metrics: Record<keyof BenchmarkMetrics, number>;
}

export function computePercentiles(
  user: BenchmarkMetrics,
  visaType: VisaTypeKey
): PercentileBreakdown {
  const benchmark = BENCHMARKS[visaType];
  const binaryMetrics = new Set<keyof BenchmarkMetrics>([
    "judging_experience",
    "leadership_roles",
  ]);

  const metrics = {} as Record<keyof BenchmarkMetrics, number>;
  let weightedSum = 0;

  for (const key of Object.keys(METRIC_WEIGHTS) as (keyof BenchmarkMetrics)[]) {
    const p = metricPercentile(user[key], benchmark[key], binaryMetrics.has(key));
    metrics[key] = p;
    weightedSum += p * METRIC_WEIGHTS[key];
  }

  return {
    overall: Math.round(weightedSum),
    metrics,
  };
}

export function getTier(percentile: number): "strong" | "average" | "below" {
  if (percentile >= 70) return "strong";
  if (percentile >= 40) return "average";
  return "below";
}

// ─── Fallback Summary ─────────────────────────────────────────────────────────

export function buildFallbackSummary(
  visaType: VisaTypeKey,
  percentile: number,
  user: BenchmarkMetrics,
  gaps: MetricGaps
): string {
  const tier = getTier(percentile);
  const worst = Object.entries(gaps)
    .filter(([, v]) => v < 0)
    .sort(([, a], [, b]) => a - b)
    .map(([k]) => k)[0];

  const visaLabel = { EB1A: "EB-1A", O1: "O-1A", EB2_NIW: "EB-2 NIW" }[visaType];
  const metricLabel: Record<string, string> = {
    publications: "scholarly publications",
    citations: "citation count",
    awards_level: "award recognition",
    media_mentions: "media coverage",
    judging_experience: "judging / peer review experience",
    leadership_roles: "leadership seniority",
    experience_years: "years of experience",
  };

  if (tier === "strong") {
    return `Your profile places you in the top 30% of ${visaLabel} applicants at the ${percentile}th percentile. You meet or exceed the benchmark in most key criteria. Focus on documenting evidence thoroughly — the profile strength is there; the petition packaging is the next critical step.`;
  }
  if (tier === "average") {
    const gap = worst ? `Your weakest area relative to approved ${visaLabel} cases is ${metricLabel[worst] || worst}. ` : "";
    return `At the ${percentile}th percentile, your profile is competitive but falls short of the typical approved ${visaLabel} case in several areas. ${gap}With 6–12 months of targeted development, you can close the key gaps and significantly improve approval odds.`;
  }
  return `Your profile currently sits at the ${percentile}th percentile relative to approved ${visaLabel} petitions — below the median in most dimensions. ${worst ? `The most significant gap is in ${metricLabel[worst] || worst}. ` : ""}A substantial evidence-building effort is needed before filing. Consider consulting an immigration attorney to build a multi-year strategy.`;
}
