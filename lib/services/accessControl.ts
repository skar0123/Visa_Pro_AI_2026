/**
 * Access control helpers.
 * The evaluate route applies these rules inline for maximum clarity.
 * These exports remain for any future callers.
 */

type AnyRecord = Record<string, unknown>;

export interface FreeEvaluationResponse {
  final_score: number;
  visa_probabilities: Record<string, number>;
  isPremiumLocked: true;
}

/**
 * Return ONLY final_score + visa_probabilities for free users.
 * Everything else (gaps, roadmap, RFE, hybrid_analysis, sections) is stripped.
 */
export function filterEvaluationResponse(
  data: AnyRecord,
  isPaid: boolean
): AnyRecord {
  if (isPaid) return data;

  const hybridScore = (
    data.hybrid_analysis as { final_score?: number } | undefined
  )?.final_score;

  const result: FreeEvaluationResponse = {
    final_score: hybridScore ?? (data.overall_score as number) ?? 0,
    visa_probabilities: (data.visa_probabilities as Record<string, number>) ?? {},
    isPremiumLocked: true,
  };

  // Safety: verify nothing extra leaked
  const keys = Object.keys(result);
  if (keys.length !== 3) {
    console.error("[accessControl] BUG: free response has unexpected keys:", keys);
  }

  return result as FreeEvaluationResponse & AnyRecord;
}
