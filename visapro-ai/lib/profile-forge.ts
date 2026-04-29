/**
 * ProfileForge AI — Rule-based profile scoring engine.
 * Computes leadership, impact, and research scores independently
 * of the Claude API, providing a baseline for the AI enrichment step.
 */

export interface ProfileData {
  name?: string;
  email?: string;
  education: string;
  workExperience: string;
  achievements: string;
  publications: string;
}

export interface ProfileScores {
  leadership_score: number;
  impact_score: number;
  research_score: number;
  overall_score: number;
}

export function analyzeProfile(data: ProfileData): ProfileScores {
  const edu = data.education.toLowerCase();
  const work = data.workExperience.toLowerCase();
  const ach = data.achievements.toLowerCase();
  const pub = data.publications.toLowerCase();
  const combined = `${work} ${ach}`;

  // ── Leadership Score (0–100) ──────────────────────────────────────────────
  let leadership = 30;

  if (/\b(lead|led|leads)\b/.test(work)) leadership += 12;
  if (/\b(manager|director|head of|vp|vice president|cto|ceo|coo|svp)\b/.test(work)) leadership += 18;
  if (/\b(principal|staff|senior|distinguished)\b/.test(work)) leadership += 8;
  if (/team of \d+|\d+ engineers|\d+ people|\d+-person team/.test(work)) leadership += 12;
  if (/\b(mentor|coached|managed)\b/.test(work)) leadership += 6;
  if (/\b(founded|co-?founded|started)\b/.test(combined)) leadership += 14;
  if (/\b(award|recognition|excellence|outstanding)\b/.test(ach)) leadership += 10;
  leadership = Math.min(leadership, 100);

  // ── Impact Score (0–100) ─────────────────────────────────────────────────
  let impact = 25;

  // Large numeric figures suggest measurable scope
  const nums = combined.match(/\d[\d,]*/g) ?? [];
  const largeNums = nums.filter((n) => parseInt(n.replace(/,/g, ""), 10) > 999);
  impact += Math.min(largeNums.length * 7, 28);

  if (/million|billion|M\b|\bB\b/.test(combined)) impact += 15;
  if (/%/.test(combined)) impact += 8;
  if (/\$([\d,]+[kKmMbB]?)/.test(combined)) impact += 10;
  if (/\b(patent|patents|launched|shipped|deployed|scaled)\b/.test(combined)) impact += 10;
  if (/\b(500m|100m|50m|10m)\b|\d{3}m\+ users|\d+ million users/.test(combined)) impact += 12;
  impact = Math.min(impact, 100);

  // ── Research Score (0–100) ───────────────────────────────────────────────
  let research = 20;

  if (/\b(phd|ph\.d|doctorate|doctoral)\b/.test(edu)) research += 22;
  else if (/\b(master|msc|ms |meng|m\.s\.)\b/.test(edu)) research += 10;

  if (/\b(stanford|mit|harvard|oxford|cambridge|caltech|cmu|eth zurich|toronto|berkeley)\b/.test(edu)) research += 12;

  if (/\b(paper|papers|publication|published|preprint)\b/.test(pub)) research += 12;
  if (/\b(journal|ieee|acm|nature|science|cell|arxiv)\b/.test(pub)) research += 10;
  if (/\b(conference|proceedings|neurips|icml|cvpr|iclr|sigchi|aaai)\b/.test(pub)) research += 8;
  if (/\b(citation|cited|h-?index|impact factor)\b/.test(pub)) research += 10;
  if (/\b(patent|patents)\b/.test(pub)) research += 8;
  if (/\b(reviewer|peer review|program committee|editorial board)\b/.test(pub)) research += 8;
  research = Math.min(research, 100);

  // ── Overall (weighted) ──────────────────────────────────────────────────
  const overall = Math.round(leadership * 0.35 + impact * 0.40 + research * 0.25);

  return {
    leadership_score: Math.round(leadership),
    impact_score: Math.round(impact),
    research_score: Math.round(research),
    overall_score: overall,
  };
}
