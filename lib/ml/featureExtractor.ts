export interface EB1AFeatures {
  awards_count: number;
  awards_tier: "low" | "medium" | "high";
  media_presence: boolean;
  judging_experience: boolean;
  original_contributions: boolean;
  authorship: boolean;
  leading_role: boolean;
  high_salary: boolean;
  memberships: boolean;
  exhibitions: boolean;
}

function n(t: string): string {
  return t.toLowerCase();
}

function countMatches(text: string, keywords: string[]): number {
  const t = n(text);
  return keywords.filter((k) => t.includes(k)).length;
}

function hasAny(text: string, keywords: string[]): boolean {
  return countMatches(text, keywords) > 0;
}

export function extract_features(profile: {
  education: string;
  experience: string;
  skills: string;
}): EB1AFeatures {
  const all = [profile.education, profile.experience, profile.skills].join(" ");

  // ── awards_count ─────────────────────────────────────────────────────────
  const awardTokens = [
    "award","prize","fellowship","honor","recognition","recipient","winner",
    "grant","scholarship","medal","distinction","laureate",
  ];
  const awards_count = Math.min(
    countMatches(all, awardTokens),
    10
  );

  // ── awards_tier ───────────────────────────────────────────────────────────
  const highTierAwards = [
    "nsf career","fulbright","nih","ieee fellow","acm fellow","national academy",
    "nobel","turing award","fields medal","royal society","presidential award",
    "best paper award","outstanding paper","most cited","top cited",
    "google research","microsoft research award","amazon research award",
  ];
  const midTierAwards = [
    "best paper","outstanding","excellence award","research award","innovation award",
    "industry award","faculty award","distinguished","honorable mention",
    "alumni award","community award","regional award",
  ];

  let awards_tier: "low" | "medium" | "high" = "low";
  if (hasAny(all, highTierAwards)) {
    awards_tier = "high";
  } else if (awards_count >= 2 && hasAny(all, midTierAwards)) {
    awards_tier = "medium";
  } else if (awards_count >= 1) {
    awards_tier = "low";
  }

  // ── media_presence ────────────────────────────────────────────────────────
  const mediaKws = [
    "featured in","covered by","press coverage","media coverage","interview",
    "forbes","techcrunch","wired","nature","science","new york times","wsj",
    "bbc","cnn","bloomberg","reuters","the guardian","wall street journal",
    "magazine","newspaper","podcast","quoted","profiled","spotlight",
  ];
  const media_presence = hasAny(all, mediaKws);

  // ── judging_experience ────────────────────────────────────────────────────
  const judgingKws = [
    "peer review","reviewer","program committee","editorial board","judge",
    "grant review","thesis committee","dissertation committee","area chair",
    "program chair","conference chair","selection committee","panel reviewer",
    "review panel","nih study section","nsf panel","jury member",
  ];
  const judging_experience = hasAny(all, judgingKws);

  // ── original_contributions ────────────────────────────────────────────────
  const contribKws = [
    "patent","invented","novel algorithm","novel method","novel framework",
    "open source","github stars","widely adopted","industry adoption",
    "licensed","commercialized","original contribution","breakthrough",
    "first to","pioneered","proposed","introduced","citation","cited by",
  ];
  const original_contributions = hasAny(all, contribKws);

  // ── authorship ────────────────────────────────────────────────────────────
  const authorKws = [
    "published","publication","paper","journal","conference","proceedings",
    "author","co-author","preprint","arxiv","ieee","acm","nature","science",
    "neurips","icml","cvpr","iclr","emnlp","sigkdd","vldb","sosp","osdi",
    "peer-reviewed","peer reviewed","scholarly","article","book chapter",
  ];
  const authorship = hasAny(all, authorKws);

  // ── leading_role ──────────────────────────────────────────────────────────
  const roleKws = [
    "cto","ceo","coo","vp of","vice president","director","lead engineer",
    "principal engineer","principal scientist","staff engineer","fellow engineer",
    "head of","founding engineer","founding scientist","research lead",
    "technical lead","senior director","engineering manager","team lead",
    "chief scientist","chief architect",
  ];
  const leading_role = hasAny(all, roleKws);

  // ── high_salary ───────────────────────────────────────────────────────────
  const salaryKws = [
    "top salary","high compensation","competitive salary","300k","400k","500k",
    "$300","$400","$500","six figure","top 10%","top 5%","stock options",
    "equity package","signing bonus","total compensation","tc of",
    "above market","premium compensation",
  ];
  const high_salary = hasAny(all, salaryKws);

  // ── memberships ───────────────────────────────────────────────────────────
  const memberKws = [
    "ieee fellow","acm fellow","aaas fellow","fellow of","national academy",
    "elected member","society member","professional fellow","distinguished member",
    "senior member","american physical society","royal society",
    "sigma xi","phi beta kappa","tau beta pi","honorary society",
  ];
  const memberships = hasAny(all, memberKws);

  // ── exhibitions ───────────────────────────────────────────────────────────
  const exhibitKws = [
    "exhibition","exhibit","showcase","gallery","museum","art show",
    "design show","product showcase","conference demo","keynote demo",
    "ces","sxsw","world expo","technology showcase","public display",
  ];
  const exhibitions = hasAny(all, exhibitKws);

  return {
    awards_count,
    awards_tier,
    media_presence,
    judging_experience,
    original_contributions,
    authorship,
    leading_role,
    high_salary,
    memberships,
    exhibitions,
  };
}

export function countCriteriaMet(f: EB1AFeatures): number {
  let count = 0;
  if (f.awards_count > 0) count++;
  if (f.memberships) count++;
  if (f.media_presence) count++;
  if (f.judging_experience) count++;
  if (f.original_contributions) count++;
  if (f.authorship) count++;
  if (f.leading_role) count++;
  if (f.high_salary) count++;
  if (f.exhibitions) count++;
  return count;
}
