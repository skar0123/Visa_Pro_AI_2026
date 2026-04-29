export interface ProfileInput {
  name: string;
  education: string;
  experience: string;
  skills: string;
}

export interface SectionResult {
  score: number;
  summary: string;
  highlights: string[];
}

export interface VisaProbabilities {
  EB1A: number;
  EB2_NIW: number;
  O1: number;
  EB5: number;
}

export interface EvaluationResult {
  overall_score: number;
  sections: {
    education: SectionResult;
    experience: SectionResult;
    skills: SectionResult;
  };
  visa_probabilities: VisaProbabilities;
  strengths: string[];
  gaps: string[];
  suggestions: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function n(text: string): string {
  return text.toLowerCase();
}

function has(text: string, keywords: string[]): boolean {
  const t = n(text);
  return keywords.some((k) => t.includes(k));
}

function countHas(text: string, keywords: string[]): number {
  const t = n(text);
  return keywords.filter((k) => t.includes(k)).length;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function extractYears(text: string): number {
  const patterns = [
    /(\d+)\+?\s*years?\s+of\s+(experience|exp)/i,
    /(\d+)\+?\s*years?\s+(in|at|with)/i,
    /experience\s*[:\-]?\s*(\d+)\+?\s*years?/i,
    /(\d+)\+?\s*yrs?\b/i,
    /over\s+(\d+)\s+years?/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return Math.min(parseInt(m[1], 10), 30);
  }
  return 0;
}

// ─── Section Scorers ─────────────────────────────────────────────────────────

function scoreEducation(education: string): SectionResult {
  const t = n(education);
  const highlights: string[] = [];
  let score = 0;

  const degreeMap = [
    { kws: ["phd", "ph.d", "doctorate", "doctoral"], pts: 40, label: "Doctoral-level degree detected" },
    { kws: ["master", "msc", "m.sc", "mba", "m.eng", "m.tech", "ms ", " ms,", "(ms)"], pts: 32, label: "Master's degree detected" },
    { kws: ["bachelor", "bsc", "b.sc", "b.eng", "b.tech", "b.s.", "b.a.", " bs ", " ba "], pts: 22, label: "Bachelor's degree detected" },
    { kws: ["associate", "diploma", "a.a.", "a.s."], pts: 12, label: "Associate / Diploma detected" },
  ];
  let degreeFound = false;
  for (const { kws, pts, label } of degreeMap) {
    if (kws.some((k) => t.includes(k))) {
      score += pts;
      highlights.push(label);
      degreeFound = true;
      break;
    }
  }
  if (!degreeFound) score += 8;

  const prestigeInstitutions = [
    "mit", "stanford", "harvard", "oxford", "cambridge", "caltech",
    "berkeley", "cmu", "carnegie mellon", "yale", "princeton", "columbia",
    "imperial college", "eth zurich", "waterloo", "toronto", "nus",
    "ntu", "iit", "epfl", "tsinghua", "peking",
  ];
  if (prestigeInstitutions.some((i) => t.includes(i))) {
    score += 12;
    highlights.push("Prestigious institution recognized");
  }

  const stemFields = [
    "computer science", "software engineering", "electrical engineering",
    "data science", "machine learning", "artificial intelligence",
    "mathematics", "statistics", "physics", "biomedical", "bioinformatics",
    "information technology", "cybersecurity", "robotics",
  ];
  const stemCount = stemFields.filter((f) => t.includes(f)).length;
  if (stemCount > 0) {
    score += Math.min(stemCount * 4, 12);
    highlights.push(`STEM field(s): ${stemFields.filter((f) => t.includes(f)).slice(0, 2).join(", ")}`);
  }

  const honors = ["summa cum laude", "magna cum laude", "cum laude", "honors", "distinction", "valedictorian", "dean's list", "scholarship", "fellowship"];
  if (honors.some((h) => t.includes(h))) {
    score += 8;
    highlights.push("Academic honors / distinction noted");
  }

  const research = ["thesis", "dissertation", "research", "publication", "published", "journal", "conference paper"];
  if (research.some((r) => t.includes(r))) {
    score += 6;
    highlights.push("Academic research contributions detected");
  }

  score = clamp(score, 10, 100);

  const summary =
    score >= 85
      ? "Exceptional academic credentials demonstrating advanced scholarly achievement in a relevant field."
      : score >= 65
      ? "Strong educational background with relevant qualifications supporting an extraordinary ability claim."
      : score >= 45
      ? "Adequate academic foundation; additional credentialing could significantly strengthen the petition."
      : "Academic profile requires augmentation — formal degrees or institutional affiliations should be documented clearly.";

  return { score, summary, highlights };
}

function scoreExperience(experience: string): SectionResult {
  const t = n(experience);
  const highlights: string[] = [];
  let score = 0;

  const years = extractYears(experience);
  if (years >= 15) { score += 40; highlights.push(`${years}+ years of professional experience`); }
  else if (years >= 10) { score += 34; highlights.push(`${years} years of professional experience`); }
  else if (years >= 7) { score += 28; highlights.push(`${years} years of professional experience`); }
  else if (years >= 5) { score += 22; highlights.push(`${years} years of professional experience`); }
  else if (years >= 3) { score += 16; highlights.push(`${years} years of professional experience`); }
  else if (years >= 1) { score += 10; highlights.push(`${years} year(s) of professional experience`); }
  else { score += 5; }

  const seniorRoles = ["chief", "cto", "ceo", "coo", "vp ", "vice president", "director", "principal", "distinguished", "fellow", "head of", "senior staff"];
  const midRoles = ["senior", "lead", "staff", "manager", "architect", "consultant", "specialist"];
  if (seniorRoles.some((r) => t.includes(r))) {
    score += 22;
    highlights.push("C-suite / Director / VP level seniority identified");
  } else if (midRoles.some((r) => t.includes(r))) {
    score += 14;
    highlights.push("Senior/Lead-level seniority identified");
  }

  const topCompanies = [
    "google", "microsoft", "apple", "amazon", "meta", "facebook",
    "netflix", "tesla", "nvidia", "openai", "deepmind", "anthropic",
    "uber", "airbnb", "stripe", "salesforce", "oracle", "ibm",
    "intel", "qualcomm", "palantir", "spacex", "linkedin",
  ];
  const companyMatches = topCompanies.filter((c) => t.includes(c));
  if (companyMatches.length > 0) {
    score += Math.min(companyMatches.length * 6, 14);
    highlights.push(`Recognized employer(s): ${companyMatches.slice(0, 2).join(", ")}`);
  }

  const impact = ["launched", "built", "founded", "led", "managed", "architected", "scaled", "grew", "increased", "reduced", "saved", "patent", "published"];
  const impactCount = impact.filter((k) => t.includes(k)).length;
  if (impactCount >= 3) { score += 10; highlights.push("Multiple quantifiable contributions evidenced"); }
  else if (impactCount >= 1) { score += 5; highlights.push("Professional impact indicators present"); }

  const intl = ["international", "global", "multinational", "abroad", "overseas", "cross-border", "worldwide"];
  if (intl.some((k) => t.includes(k))) {
    score += 6;
    highlights.push("International experience noted");
  }

  score = clamp(score, 10, 100);

  const summary =
    score >= 85
      ? "Extensive, high-impact career with demonstrable leadership in a specialized field — strong basis for extraordinary ability classification."
      : score >= 65
      ? "Solid professional history with notable achievements; peer recognition and quantified impact should be further documented."
      : score >= 45
      ? "Emerging professional record; petitioner should compile detailed evidence of specific contributions and their significance."
      : "Work history lacks sufficient detail for immigration analysis. Roles, tenure, and specific contributions must be clearly articulated.";

  return { score, summary, highlights };
}

function scoreSkills(skills: string): SectionResult {
  const t = n(skills);
  const highlights: string[] = [];
  let score = 0;

  const skillGroups = [
    { label: "AI/ML expertise", kws: ["machine learning", "deep learning", "tensorflow", "pytorch", "keras", "scikit", "nlp", "natural language", "computer vision", "transformers", "llm", "generative ai", "reinforcement learning"], pts: 12 },
    { label: "Cloud & DevOps", kws: ["aws", "azure", "gcp", "google cloud", "kubernetes", "docker", "terraform", "ci/cd", "devops", "helm", "ansible"], pts: 10 },
    { label: "Software engineering", kws: ["python", "javascript", "typescript", "java", "c++", "rust", "go", "scala", "react", "node.js", "graphql", "rest api", "microservices"], pts: 8 },
    { label: "Data engineering", kws: ["spark", "hadoop", "kafka", "airflow", "dbt", "snowflake", "databricks", "bigquery", "redshift", "flink"], pts: 10 },
    { label: "Security & systems", kws: ["cybersecurity", "penetration testing", "cryptography", "blockchain", "zero trust", "linux", "embedded systems"], pts: 8 },
    { label: "Research & academia", kws: ["research", "peer-reviewed", "publication", "grant", "nsf", "nih", "ieee", "acm", "arxiv", "citation"], pts: 10 },
  ];

  for (const group of skillGroups) {
    const matched = group.kws.filter((k) => t.includes(k));
    if (matched.length > 0) {
      score += group.pts;
      highlights.push(`${group.label}: ${matched.slice(0, 3).join(", ")}`);
    }
  }

  const skillTokens = [
    "python", "java", "javascript", "typescript", "c++", "c#", "rust", "go", "scala", "r",
    "sql", "nosql", "mongodb", "postgresql", "mysql", "redis", "elasticsearch",
    "react", "vue", "angular", "next.js", "node.js", "express", "fastapi", "django", "flask",
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform",
    "tensorflow", "pytorch", "sklearn", "pandas", "numpy", "spark",
    "git", "agile", "scrum", "figma", "tableau", "power bi",
  ];
  const tokenCount = skillTokens.filter((tk) => t.includes(tk)).length;
  score += Math.min(tokenCount * 2, 20);

  const certs = ["certified", "certification", "aws certified", "google certified", "microsoft certified", "pmp", "cissp", "cisa", "cpa", "cfa"];
  const certCount = certs.filter((c) => t.includes(c)).length;
  if (certCount > 0) {
    score += Math.min(certCount * 5, 10);
    highlights.push(`${certCount} professional certification(s) detected`);
  }

  score = clamp(score, 10, 100);

  const summary =
    score >= 85
      ? "Highly specialized technical competencies across multiple high-demand domains — consistent with O-1A/EB-1 extraordinary ability criteria."
      : score >= 65
      ? "Strong technical skill set with cross-domain expertise; documentation of applied impact will reinforce the classification."
      : score >= 45
      ? "Adequate skill base present; petitioner should emphasize unique or rare competencies not widely held in the field."
      : "Skill profile is insufficiently detailed. A comprehensive list of tools, methodologies, and certifications must be provided.";

  return { score, summary, highlights };
}

// ─── Visa Probabilities ───────────────────────────────────────────────────────

function computeVisaProbabilities(
  input: ProfileInput,
  edu: SectionResult,
  exp: SectionResult,
  overall_score: number
): VisaProbabilities {
  const full = [input.education, input.experience, input.skills].join(" ");

  const hasPubs         = has(full, ["publication", "published", "paper", "authored", "co-authored", "arxiv", "proceedings"]);
  const hasCitations    = has(full, ["cited", "citation", "h-index", "google scholar", "highly cited"]);
  const hasAwards       = has(full, ["award", "prize", "winner", "medal", "honor", "fellowship", "finalist"]);
  const hasMedia        = has(full, ["featured", "press", "interview", "forbes", "techcrunch", "wired", "bloomberg", "coverage", "keynote", "ted talk", "spoke at"]);
  const hasSalary       = has(full, ["high salary", "top 10%", "top 15%", "compensation", "total comp", "equity"]);
  const hasJudging      = has(full, ["judge", "reviewer", "review board", "editorial board", "committee", "peer review"]);
  const hasPatents      = has(full, ["patent", "invention", "inventor"]);
  const isPhD           = has(full, ["phd", "ph.d", "doctorate", "doctoral"]);
  const hasMasters      = isPhD || has(full, ["master", "msc", "mba", "m.eng", "m.tech"]);
  const isSTEM          = has(full, ["engineering", "science", "technology", "mathematics", "computer", "biology", "physics", "chemistry"]);
  const hasSenior       = has(full, ["director", "vp ", "vice president", "chief", "principal engineer", "distinguished", "fellow", "head of", "cto", "ceo", "coo"]);
  const hasPrestige     = edu.highlights.some((h) => h.toLowerCase().includes("prestigious"));
  const hasTopCompany   = exp.highlights.some((h) => h.toLowerCase().includes("employer"));
  const hasIntl         = has(full, ["international", "global", "worldwide", "multinational"]);
  const hasInvestment   = has(full, ["investor", "venture", "angel", "capital fund", "portfolio company", "net worth", "accredited investor"]);
  const hasFounder      = has(full, ["founder", "co-founder", "cofounder"]);
  const years           = extractYears(input.experience);

  // ── EB-1A (Extraordinary Ability, permanent) ──
  // USCIS: must meet 3 of 10 criteria. Very high "small percentage at top of field" bar.
  let eb1a = 8;
  if (hasAwards)                      eb1a += 18;
  if (hasPubs)                        eb1a += 16;
  if (hasCitations)                   eb1a += 13;
  if (hasJudging)                     eb1a += 13;
  if (hasMedia)                       eb1a += 11;
  if (hasSalary)                      eb1a += 9;
  if (hasSenior && hasTopCompany)     eb1a += 10;
  if (hasPatents)                     eb1a += 10;
  if (isPhD && hasPrestige)           eb1a += 8;
  if (hasIntl)                        eb1a += 5;
  if (years >= 10)                    eb1a += 5;
  eb1a += Math.floor((overall_score - 50) * 0.35);
  eb1a = clamp(eb1a, 8, 83);

  // ── EB-2 NIW (National Interest Waiver, permanent) ──
  // Dhanasar test: substantial merit + well-positioned + national interest. More accessible.
  let niw = 18;
  if (isPhD)                          niw += 20;
  else if (hasMasters)                niw += 13;
  if (isSTEM)                         niw += 12;
  if (hasPubs)                        niw += 10;
  if (hasPatents)                     niw += 9;
  if (hasAwards)                      niw += 8;
  if (years >= 5)                     niw += 8;
  if (hasPrestige)                    niw += 7;
  if (hasIntl)                        niw += 6;
  if (hasSenior)                      niw += 6;
  if (hasCitations)                   niw += 7;
  niw += Math.floor((overall_score - 40) * 0.38);
  niw = clamp(niw, 15, 90);

  // ── O-1A (Extraordinary Ability, non-immigrant — lower practical bar than EB-1A) ──
  let o1 = eb1a + 10;
  if (hasPubs)    o1 += 4;
  if (hasMedia)   o1 += 4;
  if (hasAwards)  o1 += 3;
  o1 = clamp(o1, Math.max(eb1a, 14), 87);

  // ── EB-5 (Investor, $800K–$1.05M + 10 jobs) ──
  let eb5 = 8;
  if (hasInvestment)                  eb5 += 32;
  if (hasFounder)                     eb5 += 16;
  if (has(full, ["ceo", "coo"]))      eb5 += 12;
  if (has(full, ["capital", "fund", "portfolio", "net worth"])) eb5 += 14;
  if (years >= 15)                    eb5 += 5;
  if (hasSenior)                      eb5 += 6;
  eb5 = clamp(eb5, 5, 65);

  return {
    EB1A: Math.round(eb1a),
    EB2_NIW: Math.round(niw),
    O1: Math.round(o1),
    EB5: Math.round(eb5),
  };
}

// ─── Strengths ────────────────────────────────────────────────────────────────

function generateStrengths(
  input: ProfileInput,
  edu: SectionResult,
  exp: SectionResult,
  skills: SectionResult
): string[] {
  const full = [input.education, input.experience, input.skills].join(" ");
  const strengths: string[] = [];
  const years = extractYears(input.experience);

  const isPhD      = has(full, ["phd", "ph.d", "doctorate", "doctoral"]);
  const hasMasters = isPhD || has(full, ["master", "msc", "mba", "m.eng"]);
  const hasPrestige = edu.highlights.some((h) => h.toLowerCase().includes("prestigious"));
  const hasTopCo   = exp.highlights.some((h) => h.toLowerCase().includes("employer"));
  const hasSenior  = has(full, ["director", "vp ", "chief", "principal", "fellow", "head of", "cto", "ceo"]);
  const hasPubs    = has(full, ["publication", "published", "paper", "authored", "co-authored"]);
  const hasAwards  = has(full, ["award", "prize", "winner", "medal", "fellowship"]);
  const hasPatents = has(full, ["patent", "inventor"]);
  const hasMedia   = has(full, ["featured", "press", "forbes", "techcrunch", "wired", "bloomberg", "keynote"]);
  const hasJudge   = has(full, ["judge", "reviewer", "editorial board", "committee"]);
  const hasIntl    = has(full, ["international", "global", "worldwide"]);
  const hasCites   = has(full, ["citation", "cited", "h-index"]);
  const isSTEM     = has(full, ["engineering", "science", "computer science", "mathematics", "biology", "physics"]);

  if (isPhD && hasPrestige) {
    strengths.push("Doctoral credential from a globally recognized research institution satisfies the advanced degree threshold for EB-2 and strongly supports the educational prong of EB-1A/O-1 extraordinary ability.");
  } else if (isPhD) {
    strengths.push("Doctoral-level academic credential establishes eligibility for advanced degree classifications and provides foundational support for extraordinary ability claims across EB-1A, EB-2 NIW, and O-1A.");
  } else if (hasMasters) {
    strengths.push("Advanced graduate degree satisfies the minimum educational threshold for EB-2 NIW and positions the petitioner favorably for O-1A classification in a specialized field.");
  }

  if (hasSenior && hasTopCo) {
    strengths.push("Critical role at a nationally or internationally recognized organization — directly satisfies 8 C.F.R. § 204.5(h)(3)(viii) and establishes the petitioner's field-leading status through institutional endorsement.");
  } else if (hasSenior) {
    strengths.push("Senior leadership title (Director / VP / Principal / Fellow) demonstrates that the petitioner occupies a position of significant authority, consistent with having risen to the top of their occupational field.");
  }

  if (hasPubs) {
    strengths.push("Documented scholarly authorship in peer-reviewed publications or conference proceedings — directly satisfies 8 C.F.R. § 204.5(h)(3)(vi) (original contributions) and strengthens both EB-1A and EB-2 NIW national importance arguments.");
  }

  if (hasCites) {
    strengths.push("Evidence of citations to the petitioner's work demonstrates that peers in the field have recognized and built upon their contributions — a compelling indicator of sustained, field-wide influence meeting the 'major significance' standard.");
  }

  if (hasAwards) {
    strengths.push("Receipt of competitive prizes or fellowships satisfies 8 C.F.R. § 204.5(h)(3)(i) (lesser nationally/internationally recognized prize) — one of the most direct and documentable EB-1A criteria.");
  }

  if (hasPatents) {
    strengths.push("Patent ownership establishes original invention and is treated by USCIS as strong evidence of original contributions of major significance, particularly in technology and engineering fields.");
  }

  if (hasMedia) {
    strengths.push("Published media coverage or keynote speaking engagements in recognized trade publications or industry forums satisfy the media criterion under 8 C.F.R. § 204.5(h)(3)(iii) and establish national visibility.");
  }

  if (hasJudge) {
    strengths.push("Participation as a judge, reviewer, or editorial board member directly satisfies 8 C.F.R. § 204.5(h)(3)(iv) (judging the work of others) — one of the most straightforward O-1A/EB-1A criteria to document.");
  }

  if (years >= 10) {
    strengths.push(`${years}-year sustained professional career demonstrates the consistent trajectory of achievement and industry recognition that USCIS adjudicators look for beyond isolated accomplishments.`);
  }

  if (hasIntl) {
    strengths.push("International scope of work and recognition broadens the evidentiary record beyond domestic acclaim — USCIS weighs global visibility heavily when assessing whether recognition is 'national or international' as required.");
  }

  if (isSTEM && edu.score >= 60) {
    strengths.push("STEM background in a field of strategic national importance (technology, engineering, or sciences) significantly strengthens the 'national interest' prong of an EB-2 NIW Matter of Dhanasar analysis.");
  }

  return strengths.slice(0, 6);
}

// ─── Gaps ────────────────────────────────────────────────────────────────────

function generateGaps(
  edu: SectionResult,
  exp: SectionResult,
  skills: SectionResult,
  input: ProfileInput
): string[] {
  const full = [input.education, input.experience, input.skills].join(" ");
  const gaps: string[] = [];

  if (edu.score < 60) {
    gaps.push(
      "[EB-1A / O-1A] The record does not sufficiently establish the petitioner's academic credentials as meeting the 'extraordinary' threshold. USCIS adjudicators will scrutinize whether the educational background rises to the level of 'a degree of expertise significantly above that ordinarily encountered' in the field. A doctoral degree or post-doctoral credential from a recognized institution dramatically strengthens this component."
    );
  }

  if (exp.score < 60) {
    gaps.push(
      "[EB-1A / O-1A] Insufficient evidence of sustained national or international acclaim. The petition must document that the beneficiary has risen to the very top of their field — not merely that they have worked in it for a period of time. USCIS requires a totality-of-evidence showing that the petitioner is among the small percentage at the top, supported by independent third-party recognition."
    );
  }

  if (!has(full, ["publication", "published", "paper", "journal", "arxiv", "proceedings", "authored"])) {
    gaps.push(
      "[EB-1A / EB-2 NIW] No scholarly publications, conference proceedings, or peer-reviewed contributions are documented in the record. Published authorship — particularly in high-impact journals (Nature, Science, IEEE, ACM, NeurIPS) or recognized conference proceedings — is one of the most persuasive evidentiary criteria under 8 C.F.R. § 204.5(h)(3)(vi) and is directly relevant to the EB-2 NIW 'substantial merit' prong. Absence of publications is a common basis for USCIS RFE issuance."
    );
  }

  if (!has(full, ["award", "prize", "recognition", "winner", "finalist", "honor", "medal"])) {
    gaps.push(
      "[EB-1A / O-1A] The petition does not demonstrate receipt of nationally or internationally recognized prizes or awards for excellence in the field (8 C.F.R. § 204.5(h)(3)(i)). Such recognition — including competitive fellowships, NSF/NIH grants, industry awards, or major competition wins — constitutes one of the most direct and well-understood criteria. Without at least one documented award, the EB-1A threshold of three satisfied criteria becomes more difficult to meet."
    );
  }

  if (!has(full, ["media", "press", "interview", "feature", "forbes", "wired", "bloomberg", "techcrunch", "coverage", "keynote", "ted"])) {
    gaps.push(
      "[EB-1A] No evidence of published material about the petitioner or their work in major media, trade publications, or professional journals (8 C.F.R. § 204.5(h)(3)(iii)). Media coverage and expert commentary establish the petitioner's public-facing visibility within their field at the national or international level. Third-party media validates the claim that others in the field recognize the petitioner's extraordinary status."
    );
  }

  if (!has(full, ["salary", "compensation", "high salary", "top 10%", "top 15%", "equity", "total comp"])) {
    gaps.push(
      "[EB-1A] The record does not address whether the petitioner commands a high salary or remuneration significantly above others in the field (8 C.F.R. § 204.5(h)(3)(ix)). Compensation in the top 10–15% for the occupation and geographic area — documented with BLS wage data, Levels.fyi, or a compensation expert letter — directly satisfies this criterion and is one of the more achievable evidence types for technology professionals."
    );
  }

  if (!has(full, ["judge", "reviewer", "editorial board", "review committee", "peer review", "panel"])) {
    gaps.push(
      "[EB-1A / O-1A] There is no evidence of participation as a judge, reviewer, or evaluator of others' work in the field (8 C.F.R. § 204.5(h)(3)(iv)). Serving as a peer reviewer for journals, a program committee member for top-tier conferences, or a grant reviewer for NSF/NIH directly satisfies this criterion. This is one of the easiest criteria to obtain prospectively and should be a priority for petitioners currently lacking it."
    );
  }

  if (!has(full, ["niw", "national interest", "national importance", "matter of dhanasar", "substantial merit"])) {
    if (edu.score < 70 || exp.score < 60) {
      gaps.push(
        "[EB-2 NIW] The record does not clearly articulate the 'national importance' of the petitioner's work as required under the Matter of Dhanasar framework. USCIS requires a detailed narrative explaining why the petitioner's specific work has substantial merit that extends beyond local or regional significance and reaches a national or global scale. This typically requires a detailed cover letter, expert opinion letters, and documentary evidence such as government citations, media coverage, or policy impact."
      );
    }
  }

  return gaps.slice(0, 6);
}

// ─── Suggestions ─────────────────────────────────────────────────────────────

function generateSuggestions(
  edu: SectionResult,
  exp: SectionResult,
  skills: SectionResult,
  input: ProfileInput
): string[] {
  const full = [input.education, input.experience, input.skills].join(" ");
  const suggestions: string[] = [];

  suggestions.push(
    "RECOMMENDATION LETTERS (Highest Priority): Obtain 6–8 expert recommendation letters from recognized authorities who have no current professional relationship with you — ideally professors at R1 research universities, principal investigators at national laboratories, or senior technical fellows at Fortune 500 companies. Each letter must speak specifically to your field-wide contributions and their significance, not merely describe your work. Ask letter writers to cite your publications, explain why your contributions are non-obvious, and state explicitly that you are among the top X% of professionals in the field."
  );

  if (!has(full, ["publication", "published", "paper", "arxiv"])) {
    suggestions.push(
      "PUBLICATIONS (High Priority): Prioritize submitting 2–4 peer-reviewed papers to recognized venues within your field — IEEE, ACM, NeurIPS, ICML, ICLR, Nature, PNAS, or domain-specific top journals. Even workshop papers at major conferences can count. For faster timelines, post preprints on arXiv immediately upon completion — this establishes a public timestamp and allows others to cite your work. Document any citations your work receives using Google Scholar or Semantic Scholar, and prepare a citation analysis for the petition."
  );
  }

  if (!has(full, ["patent", "inventor"])) {
    suggestions.push(
      "PATENTS (High Priority): File at least one provisional patent application (USPTO) covering any novel method, system, or process you have invented. Provisional applications are inexpensive (~$320 government fee), immediately establish a priority date, and allow you to claim 'patent pending' status. Even a filed (not yet granted) patent application counts as documentary evidence in an EB-1A/O-1A petition. Work with a patent attorney to identify patentable innovations from your recent work — many engineers and scientists have patentable ideas they have not formalized."
    );
  }

  if (!has(full, ["judge", "reviewer", "editorial board", "committee"])) {
    suggestions.push(
      "PEER REVIEW & JUDGING (Medium Priority): Begin serving as a technical reviewer for journals in your field (request to join as a reviewer on journals' official websites — most accept applications). Apply to be a program committee member for relevant conferences (PC membership is invitation-based but increasingly open; reach out directly to general chairs). Alternatively, apply to be a reviewer for NSF, NIH, or DARPA grant programs — reviewer positions are actively sought and constitute compelling evidence under 8 C.F.R. § 204.5(h)(3)(iv)."
    );
  }

  if (!has(full, ["award", "prize", "fellowship", "grant"])) {
    suggestions.push(
      "AWARDS & RECOGNITION (High Priority): Apply systematically for competitive industry awards, professional society fellowships, and government grants: (1) IEEE or ACM Senior/Fellow membership; (2) NSF CAREER Award or SBIR/STTR grants; (3) Industry awards such as MIT Technology Review Innovators Under 35, Forbes 30 Under 30, or sector-specific excellence awards; (4) Internal company awards — even 'top performer' or 'technical excellence' designations from tier-1 companies carry weight when accompanied by a supporting letter from executive leadership describing the competitive selection process."
    );
  }

  suggestions.push(
    "HIGH SALARY DOCUMENTATION: Collect comprehensive compensation evidence establishing that you are paid in the top 10–15% for your occupation and geography: (1) an employer letter on company letterhead stating your total compensation (base, bonus, equity); (2) a third-party compensation survey comparison (Levels.fyi, Radford/Aon, Mercer) showing your percentile; (3) Bureau of Labor Statistics OES wage data for your occupation code. This evidence directly satisfies 8 C.F.R. § 204.5(h)(3)(ix) and is one of the most achievable criteria for professionals at established companies."
  );

  if (!has(full, ["media", "press", "featured", "bloomberg", "wired", "techcrunch", "forbes", "keynote"])) {
    suggestions.push(
      "MEDIA PRESENCE & SPEAKING: Develop a systematic strategy for media visibility: (1) Pitch your research or technical insights to journalists at relevant publications (a concise, story-angle email to science/tech reporters at Forbes, Wired, or TechCrunch often receives responses); (2) Apply to speak at major conferences in your field — even a single keynote or invited talk at a nationally recognized event provides significant documentary evidence; (3) Publish technical blog posts or columns that are cited or shared by others in the field; (4) Seek to be quoted as an expert source in news stories covering your field's developments."
    );
  }

  if (edu.score < 70) {
    suggestions.push(
      "ACADEMIC CREDENTIALS: If you do not hold a terminal degree, consider pursuing one part-time or seeking an adjunct/visiting faculty appointment at a recognized university. Alternatively, document any honorary degrees, named fellowships, invited lecture series, or curriculum development roles. Post-doctoral research positions — even unpaid or part-time — establish academic affiliation and produce publications simultaneously. For EB-2 NIW specifically, an advanced degree from any accredited institution (including international) satisfies the foundational requirement."
    );
  }

  suggestions.push(
    "EVIDENCE ORGANIZATION (Critical): Structure your entire petition as a tabbed exhibit binder with labeled exhibits for each criterion you are claiming. For each exhibit: include a cover memo (written by your attorney) citing the specific regulatory criterion, followed by primary evidence (certificates, letters, publications), then secondary corroborating evidence (news clippings, screenshots, citation reports). USCIS adjudicators appreciate a well-organized record and are less likely to issue an RFE when all evidence is clearly labeled and cross-referenced to the legal standard."
  );

  return suggestions.slice(0, 6);
}

// ─── Advanced Interfaces ─────────────────────────────────────────────────────

export interface RoadmapItem {
  timeline: "3mo" | "6mo" | "1yr";
  action: string;
  impact: string;
  effort: "Low" | "Medium" | "High";
  category: "credential" | "publication" | "recognition" | "legal" | "network" | "documentation";
}

export interface RFEPrediction {
  criterion: string;
  risk: "High" | "Medium" | "Low";
  objection: string;
  mitigation: string;
  cfr_reference: string;
}

export interface ApprovalSimulation {
  current: VisaProbabilities;
  projected: VisaProbabilities;
  improvements: string[];
}

// ─── Roadmap Generator ────────────────────────────────────────────────────────

export function generateRoadmap(input: ProfileInput, result: EvaluationResult): RoadmapItem[] {
  const full = [input.education, input.experience, input.skills].join(" ");
  const items: RoadmapItem[] = [];

  const hasPubs    = has(full, ["publication", "published", "paper", "arxiv", "authored"]);
  const hasAwards  = has(full, ["award", "prize", "fellowship", "medal"]);
  const hasJudge   = has(full, ["judge", "reviewer", "editorial board", "committee"]);
  const hasPatents = has(full, ["patent", "inventor"]);
  const hasMedia   = has(full, ["press", "featured", "forbes", "wired", "bloomberg", "keynote"]);
  const hasSalary  = has(full, ["salary", "compensation", "equity", "total comp"]);

  // 3-Month items
  items.push({
    timeline: "3mo",
    action: "Compile a complete evidence inventory: gather every award certificate, publication PDF, reference letter, and recognition document you have received to date.",
    impact: "Creates the foundation your attorney needs to assess exactly which criteria you already satisfy and which require supplementation.",
    effort: "Low",
    category: "documentation",
  });

  if (!hasJudge) {
    items.push({
      timeline: "3mo",
      action: "Apply to serve as a peer reviewer for 2–3 journals in your field (email journal editors directly or register via Publons/Web of Science). Aim for at least one accepted reviewer role within 90 days.",
      impact: "Directly satisfies 8 C.F.R. § 204.5(h)(3)(iv) — one of the easiest EB-1A/O-1A criteria to obtain prospectively.",
      effort: "Low",
      category: "recognition",
    });
  }

  if (!hasSalary) {
    items.push({
      timeline: "3mo",
      action: "Request an employer compensation letter on company letterhead documenting total compensation (base, bonus, equity). Cross-reference with BLS OES wage data and Levels.fyi for your occupation and geography.",
      impact: "Satisfies the high salary criterion (8 C.F.R. § 204.5(h)(3)(ix)) — one of the most achievable criteria for tech/STEM professionals.",
      effort: "Low",
      category: "documentation",
    });
  }

  items.push({
    timeline: "3mo",
    action: "Identify and contact 6–8 potential expert recommendation letter writers: professors at R1 universities, national lab PIs, or technical fellows who can speak to your field-wide contributions without a current employment relationship.",
    impact: "Expert letters are the single most important element of any extraordinary ability petition — USCIS adjudicators weight independent third-party endorsements heavily.",
    effort: "Medium",
    category: "network",
  });

  // 6-Month items
  if (!hasPubs) {
    items.push({
      timeline: "6mo",
      action: "Submit at least one technical paper to a peer-reviewed journal or top-tier conference (IEEE, ACM, NeurIPS, domain-specific venue). Post a preprint on arXiv immediately to establish a priority date and enable early citations.",
      impact: "Satisfies 8 C.F.R. § 204.5(h)(3)(vi) — scholarly contributions of major significance. Also strengthens EB-2 NIW national importance argument substantially.",
      effort: "High",
      category: "publication",
    });
  }

  if (!hasAwards) {
    items.push({
      timeline: "6mo",
      action: "Apply for 3–5 competitive awards or grants: NSF CAREER, IEEE/ACM fellowship, industry recognition programs (MIT TR35, Forbes 30 Under 30), or internal company 'technical excellence' awards with formal selection criteria.",
      impact: "Directly satisfies 8 C.F.R. § 204.5(h)(3)(i). Even a competitive grant award (not just fellowship) qualifies as a nationally recognized prize.",
      effort: "High",
      category: "recognition",
    });
  }

  if (!hasMedia) {
    items.push({
      timeline: "6mo",
      action: "Develop a media strategy: pitch your research insights to journalists at Forbes/Wired/TechCrunch; apply to speak at 1–2 nationally recognized conferences; publish a technical column or contribute to a recognized industry publication.",
      impact: "Satisfies 8 C.F.R. § 204.5(h)(3)(iii) (published material in major media). Third-party media coverage validates extraordinary status in the eyes of adjudicators.",
      effort: "Medium",
      category: "recognition",
    });
  }

  items.push({
    timeline: "6mo",
    action: "Engage an experienced immigration attorney specializing in EB-1A/O-1A petitions. Request a full case assessment and begin drafting the petition cover letter and evidence strategy document.",
    impact: "Attorney-drafted cover letters framing evidence against specific regulatory criteria significantly reduce RFE rates compared to self-prepared petitions.",
    effort: "Medium",
    category: "legal",
  });

  // 1-Year items
  if (!hasPatents) {
    items.push({
      timeline: "1yr",
      action: "File a provisional patent application (USPTO) on any novel method, system, or process from your recent work. Convert to a non-provisional within 12 months. Patent filings directly evidence original contributions.",
      impact: "Patent ownership satisfies 8 C.F.R. § 204.5(h)(3)(v) (original contributions of major significance) and demonstrates innovation leadership within your field.",
      effort: "High",
      category: "credential",
    });
  }

  if (result.sections.education.score < 70) {
    items.push({
      timeline: "1yr",
      action: "Pursue an adjunct faculty appointment, visiting researcher role, or post-doctoral affiliation at a recognized university. Alternatively, enroll in a part-time doctoral program if not already holding a terminal degree.",
      impact: "Institutional affiliation strengthens both the educational prong and the critical role criterion, and creates opportunities for ongoing publication and peer review activity.",
      effort: "High",
      category: "credential",
    });
  }

  items.push({
    timeline: "1yr",
    action: "File the I-140 or O-1 petition with premium processing ($2,805 as of 2024). Ensure your exhibit binder includes labeled tabs for each satisfied criterion with primary evidence, corroborating evidence, and expert letters cross-referencing each regulatory standard.",
    impact: "Premium processing reduces adjudication to 15 business days. A well-organized binder reduces RFE likelihood and positions the case for favorable officer discretion.",
    effort: "High",
    category: "legal",
  });

  return items;
}

// ─── RFE Predictor ────────────────────────────────────────────────────────────

export function generateRFEPredictions(input: ProfileInput, result: EvaluationResult): RFEPrediction[] {
  const full = [input.education, input.experience, input.skills].join(" ");
  const predictions: RFEPrediction[] = [];

  const hasPubs    = has(full, ["publication", "published", "paper", "arxiv", "authored", "proceedings"]);
  const hasAwards  = has(full, ["award", "prize", "fellowship", "medal", "winner"]);
  const hasJudge   = has(full, ["judge", "reviewer", "editorial board", "committee", "peer review"]);
  const hasPatents = has(full, ["patent", "inventor"]);
  const hasMedia   = has(full, ["press", "featured", "forbes", "wired", "bloomberg", "keynote", "coverage"]);
  const hasSalary  = has(full, ["salary", "compensation", "high salary", "top 10%", "equity", "total comp"]);
  const hasCritical = has(full, ["director", "vp ", "chief", "principal", "fellow", "head of", "cto", "ceo", "critical role"]);
  const hasCites   = has(full, ["citation", "cited", "h-index", "google scholar"]);

  if (!hasPubs && !hasCites) {
    predictions.push({
      criterion: "Original Contributions of Major Significance",
      risk: "High",
      cfr_reference: "8 C.F.R. § 204.5(h)(3)(vi)",
      objection: "The record does not contain published papers, conference proceedings, or evidence of citations to the petitioner's work. USCIS will likely issue an RFE requesting specific documentation of how the petitioner's contributions have been adopted, cited, or recognized by others in the field, distinguishing them from routine professional output.",
      mitigation: "Submit at least 2 peer-reviewed publications, a Google Scholar citation count, any evidence of work being adopted by peers or cited in subsequent research, and an expert letter explaining the novelty and significance of your specific contributions.",
    });
  }

  if (!hasAwards) {
    predictions.push({
      criterion: "Nationally/Internationally Recognized Prizes or Awards",
      risk: "High",
      cfr_reference: "8 C.F.R. § 204.5(h)(3)(i)",
      objection: "The petition does not include evidence of prizes, awards, or fellowships granted on the basis of excellence in the field. USCIS will question whether the petitioner has received any recognition that is competitive, prestigious, and granted at a national or international level — as distinguished from routine performance reviews or employer bonuses.",
      mitigation: "Document any competitive awards, fellowships, grants, or competition placements. Include selection criteria, number of applicants vs. recipients, and a letter from the awarding organization explaining the prestige of the honor.",
    });
  }

  if (!hasJudge) {
    predictions.push({
      criterion: "Participation as a Judge of Others' Work",
      risk: "Medium",
      cfr_reference: "8 C.F.R. § 204.5(h)(3)(iv)",
      objection: "No evidence of peer review, editorial board membership, conference program committee participation, or grant review panel service is documented. USCIS may note that the petitioner has not demonstrated that peers in the field seek their expert evaluation of others' work — which is a marker of recognized expertise.",
      mitigation: "Obtain a letter from any journal, conference, or grant agency confirming your reviewer status. Even one documented peer review invitation (with the review request email) can satisfy this criterion.",
    });
  }

  if (!hasMedia) {
    predictions.push({
      criterion: "Published Material About the Petitioner",
      risk: "Medium",
      cfr_reference: "8 C.F.R. § 204.5(h)(3)(iii)",
      objection: "The record lacks evidence of articles, interviews, or coverage in major trade publications, newspapers, or professional journals about the petitioner or their work (as distinguished from work they authored). USCIS may conclude that the petitioner's work lacks the field-wide visibility consistent with extraordinary ability.",
      mitigation: "Collect any press coverage, podcast interviews, expert quotes in news articles, conference coverage, or social media posts from recognized industry influencers referencing your work. Even one substantive article in a recognized trade publication helps satisfy this criterion.",
    });
  }

  if (!hasSalary) {
    predictions.push({
      criterion: "High Salary Relative to Others in the Field",
      risk: "Medium",
      cfr_reference: "8 C.F.R. § 204.5(h)(3)(ix)",
      objection: "The petition does not include compensation documentation establishing that the petitioner commands a salary significantly above the average for their occupation and geographic area. Without this, USCIS cannot independently verify the petitioner's market value as a proxy for their recognized excellence.",
      mitigation: "Provide an employer letter with total compensation breakdown, a BLS OES wage percentile comparison, and supporting data from Levels.fyi, Radford, or Mercer for your specific role and location. A compensation expert declaration may further strengthen this evidence.",
    });
  }

  if (!hasCritical) {
    predictions.push({
      criterion: "Critical or Essential Role for Distinguished Organizations",
      risk: result.sections.experience.score < 60 ? "High" : "Low",
      cfr_reference: "8 C.F.R. § 204.5(h)(3)(viii)",
      objection: "The petition does not clearly establish that the petitioner has performed in a leading or critical capacity for organizations with a distinguished reputation. USCIS will scrutinize whether the petitioner's role was truly essential — not merely senior — and whether the employing organization qualifies as 'distinguished' in its field.",
      mitigation: "Obtain an employer letter from a C-suite executive describing the critical nature of your role, specific technical decisions only you could make, and the organization's distinguished reputation (awards, market position, peer recognition). Include evidence of the organization's prominence in the field.",
    });
  }

  if (!hasPatents) {
    predictions.push({
      criterion: "Original Scientific, Scholarly, or Business-Related Contributions",
      risk: "Low",
      cfr_reference: "8 C.F.R. § 204.5(h)(3)(v)",
      objection: "Without patents or published research, USCIS may question whether the petitioner's contributions rise to the level of 'major significance' in the field. The petitioner must demonstrate that their contributions have had or are likely to have a substantial impact — not simply that they have performed their job competently.",
      mitigation: "Document any proprietary algorithms, systems, or methods you have developed that are in commercial use; any open-source projects you created with significant adoption; or expert letters attesting that your specific technical innovations have influenced the direction of the field.",
    });
  }

  return predictions.slice(0, 6);
}

// ─── Approval Simulation ──────────────────────────────────────────────────────

export function computeApprovalSimulation(input: ProfileInput, result: EvaluationResult): ApprovalSimulation {
  const full = [input.education, input.experience, input.skills].join(" ");
  const improvements: string[] = [];

  const hasPubs   = has(full, ["publication", "published", "paper", "arxiv"]);
  const hasAwards = has(full, ["award", "prize", "fellowship"]);
  const hasJudge  = has(full, ["judge", "reviewer", "editorial board"]);
  const hasPatent = has(full, ["patent", "inventor"]);
  const hasMedia  = has(full, ["press", "featured", "forbes", "wired", "bloomberg"]);
  const hasSalary = has(full, ["salary", "compensation", "high salary", "top 10%"]);

  const current = result.visa_probabilities;

  // Project "after improvements" scenario
  let eb1a  = current.EB1A;
  let niw   = current.EB2_NIW;
  let o1    = current.O1;
  let eb5   = current.EB5;

  if (!hasPubs) {
    eb1a += 16; niw += 10; o1 += 8;
    improvements.push("Publish 2+ peer-reviewed papers (+16% EB-1A, +10% NIW, +8% O-1A)");
  }
  if (!hasAwards) {
    eb1a += 18; o1 += 12;
    improvements.push("Receive a competitive award or fellowship (+18% EB-1A, +12% O-1A)");
  }
  if (!hasJudge) {
    eb1a += 8; o1 += 7;
    improvements.push("Serve as a peer reviewer or judge (+8% EB-1A, +7% O-1A)");
  }
  if (!hasMedia) {
    eb1a += 11; o1 += 9;
    improvements.push("Gain press coverage or keynote speaking (+11% EB-1A, +9% O-1A)");
  }
  if (!hasSalary) {
    eb1a += 9; o1 += 6;
    improvements.push("Document top-15% compensation (+9% EB-1A, +6% O-1A)");
  }
  if (!hasPatent) {
    eb1a += 8; niw += 7;
    improvements.push("File a patent application (+8% EB-1A, +7% NIW)");
  }

  const projected: VisaProbabilities = {
    EB1A: clamp(Math.round(eb1a), current.EB1A, 88),
    EB2_NIW: clamp(Math.round(niw), current.EB2_NIW, 92),
    O1: clamp(Math.round(o1), current.O1, 90),
    EB5: eb5,
  };

  return { current, projected, improvements };
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export function evaluateProfile(input: ProfileInput): EvaluationResult {
  const education = scoreEducation(input.education);
  const experience = scoreExperience(input.experience);
  const skills = scoreSkills(input.skills);

  const overall_score = Math.round(
    education.score * 0.3 + experience.score * 0.4 + skills.score * 0.3
  );

  const visa_probabilities = computeVisaProbabilities(input, education, experience, overall_score);
  const strengths = generateStrengths(input, education, experience, skills);
  const gaps = generateGaps(education, experience, skills, input);
  const suggestions = generateSuggestions(education, experience, skills, input);

  return {
    overall_score,
    sections: { education, experience, skills },
    visa_probabilities,
    strengths,
    gaps,
    suggestions,
  };
}
