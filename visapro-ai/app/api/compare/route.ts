import { NextRequest, NextResponse } from "next/server";
import { extractMetrics, compareProfile, computePercentiles, getTier, buildFallbackSummary } from "@/lib/comparison";
import { BENCHMARKS, type VisaTypeKey } from "@/lib/benchmarkProfiles";
import { generateComparisonNarrative } from "@/lib/claude";

const VALID_VISA_TYPES = new Set<string>(["EB1A", "O1", "EB2_NIW"]);

export async function POST(req: NextRequest) {
  let body: {
    education?: string;
    experience?: string;
    skills?: string;
    visaType?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const visaType: VisaTypeKey = VALID_VISA_TYPES.has(body.visaType ?? "")
    ? (body.visaType as VisaTypeKey)
    : "EB1A";

  const profile = {
    education:  body.education  ?? "",
    experience: body.experience ?? "",
    skills:     body.skills     ?? "",
  };

  if (!profile.education && !profile.experience && !profile.skills) {
    return NextResponse.json({ error: "Profile is empty." }, { status: 400 });
  }

  // Extract numeric metrics from free-text profile
  const userMetrics = extractMetrics(profile);
  const benchmark   = BENCHMARKS[visaType];

  // Compute gaps and percentiles
  const gaps       = compareProfile(userMetrics, benchmark);
  const percentiles = computePercentiles(userMetrics, visaType);
  const tier        = getTier(percentiles.overall);

  // AI narrative (falls back to rule-based if Claude unavailable)
  const aiSummary = await generateComparisonNarrative(
    visaType,
    percentiles.overall,
    userMetrics as unknown as Record<string, number>,
    benchmark   as unknown as Record<string, number>,
    gaps        as unknown as Record<string, number>
  );

  const summary = aiSummary ?? buildFallbackSummary(visaType, percentiles.overall, userMetrics, gaps);

  return NextResponse.json({
    visaType,
    userMetrics,
    benchmarkMetrics: benchmark,
    gaps,
    percentile: percentiles.overall,
    metricPercentiles: percentiles.metrics,
    tier,
    summary,
  });
}
