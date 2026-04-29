"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/Logo";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  name: string;
  email: string;
  education: string;
  workExperience: string;
  achievements: string;
  publications: string;
}

interface GapItem {
  area: string;
  status: "missing" | "weak" | "strong";
  description: string;
}

interface AnalysisResult {
  scores: {
    leadership_score: number;
    impact_score: number;
    research_score: number;
    overall_score: number;
  };
  aiAnalysis: {
    rewritten_profile: string[];
    improvement_suggestions: string[];
    gap_analysis: GapItem[];
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT = "#a855f7";

const STEPS = [
  {
    number: 1,
    label: "Education",
    sublabel: "Degrees, institutions & honors",
    field: "education" as const,
    icon: (
      <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m-4-4l4 4 4-4" />
      </svg>
    ),
    placeholder:
      "• PhD in Computer Science, Stanford University (2019)\n• Dissertation: Large-Scale Distributed Systems\n• GPA 4.0, NSF Graduate Research Fellowship\n• Graduated summa cum laude, Dean's List all 4 years",
    hint: "Include degree level, institution, field of study, GPA, fellowships, and academic honors.",
    limit: 1200,
  },
  {
    number: 2,
    label: "Work Experience",
    sublabel: "Roles, leadership & measurable impact",
    field: "workExperience" as const,
    icon: (
      <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    placeholder:
      "• Staff Engineer, Google DeepMind (2019–present)\n• Led team of 12, products serving 500M+ users\n• Principal Engineer, OpenAI (2017–2019)\n• Co-authored 3 patents on transformer efficiency",
    hint: "Include titles, company names, team size, years, and specific measurable outcomes.",
    limit: 1200,
  },
  {
    number: 3,
    label: "Achievements",
    sublabel: "Awards, patents & recognition",
    field: "achievements" as const,
    icon: (
      <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    placeholder:
      "• MIT Technology Review 35 Innovators Under 35 (2022)\n• 3 USPTO patents granted (US 11,234,567)\n• $2M NSF CAREER Award recipient\n• Speaker at NeurIPS, ICML, and IEEE conferences",
    hint: "List awards, grants, patents, speaking invitations, and any industry recognition.",
    limit: 900,
  },
  {
    number: 4,
    label: "Publications / Awards",
    sublabel: "Research papers, media & peer review",
    field: "publications" as const,
    icon: (
      <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    placeholder:
      "• 8 peer-reviewed papers (NeurIPS 2023, ICML 2022, IEEE Transactions)\n• h-index: 12, total citations: 480\n• Reviewer: NeurIPS, ICML, Nature Machine Intelligence\n• Featured in MIT Tech Review, TechCrunch, Wired",
    hint: "List publications with venues, citation counts, peer review activities, and press mentions.",
    limit: 900,
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreRing({
  score,
  label,
  color,
  delay,
}: {
  score: number;
  label: string;
  color: string;
  delay: number;
}) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        padding: "24px 20px",
        borderRadius: 16,
        background: "rgba(10,12,20,0.8)",
        border: `1px solid ${color}25`,
        backdropFilter: "blur(12px)",
        flex: 1,
        minWidth: 140,
      }}
    >
      <svg width={100} height={100} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={50} cy={50} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
        <motion.circle
          cx={50}
          cy={50}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, delay: delay + 0.2, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
        />
        <text
          x={50}
          y={56}
          textAnchor="middle"
          fill="#fff"
          fontSize={22}
          fontWeight={700}
          style={{ transform: "rotate(90deg) translate(0, -100px)", transformOrigin: "50px 50px", fontFamily: "system-ui" }}
        >
          {score}
        </text>
      </svg>
      <div style={{ fontSize: 12, fontWeight: 600, color: color, letterSpacing: "0.06em", textTransform: "uppercase", textAlign: "center" }}>
        {label}
      </div>
    </motion.div>
  );
}

function GapCard({ item, index }: { item: GapItem; index: number }) {
  const colors = {
    strong: { bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)", text: "#10b981", dot: "#10b981" },
    weak: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)", text: "#f59e0b", dot: "#f59e0b" },
    missing: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", text: "#ef4444", dot: "#ef4444" },
  };
  const c = colors[item.status];
  const labels = { strong: "Strong", weak: "Needs Work", missing: "Missing" };

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      style={{
        padding: "14px 18px",
        borderRadius: 12,
        background: c.bg,
        border: `1px solid ${c.border}`,
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
      }}
    >
      <div style={{ marginTop: 3, flexShrink: 0 }}>
        {item.status === "strong" ? (
          <svg width={18} height={18} fill="none" viewBox="0 0 24 24" stroke={c.dot} strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : item.status === "weak" ? (
          <svg width={18} height={18} fill="none" viewBox="0 0 24 24" stroke={c.dot} strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        ) : (
          <svg width={18} height={18} fill="none" viewBox="0 0 24 24" stroke={c.dot} strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{item.area}</span>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: c.text, background: `${c.bg}`, border: `1px solid ${c.border}`, borderRadius: 999, padding: "2px 8px" }}>
            {labels[item.status]}
          </span>
        </div>
        <p style={{ fontSize: 12.5, color: "rgba(148,163,184,0.75)", lineHeight: 1.6 }}>{item.description}</p>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProfileForgePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    education: "",
    workExperience: "",
    achievements: "",
    publications: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  }

  function canGoNext(): boolean {
    if (currentStep === 1) return true; // education optional but nudge to fill
    return true;
  }

  async function handleSubmit() {
    if (!form.education.trim() && !form.workExperience.trim() && !form.achievements.trim()) {
      setError("Please fill in at least one section (Education, Work Experience, or Achievements) before analyzing.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/profile-forge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Analysis failed.");
      }

      const data: AnalysisResult = await res.json();
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setResult(null);
    setCurrentStep(1);
    setForm({ name: "", email: "", education: "", workExperience: "", achievements: "", publications: "" });
    setError(null);
  }

  const stepConfig = STEPS[currentStep - 1];
  const filledSteps = STEPS.filter((s) => form[s.field].trim().length > 0).length;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#03050f", color: "#e2e8f0" }}>
      {/* ── Nav ──────────────────────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 24px",
        background: "linear-gradient(to bottom, rgba(3,5,15,0.97) 0%, rgba(3,5,15,0.85) 100%)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(168,85,247,0.12)",
      }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <Logo size={28} />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: ACCENT, background: `${ACCENT}15`, border: `1px solid ${ACCENT}30`, borderRadius: 999, padding: "3px 10px" }}>
            ProfileForge AI
          </span>
          <Link
            href="/"
            style={{
              textDecoration: "none", fontSize: 13, color: "rgba(148,163,184,0.7)",
              padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)",
              transition: "all 0.15s ease",
            }}
          >
            ← Back
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "100px 24px 80px" }}>

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          style={{ textAlign: "center", marginBottom: 56 }}
        >
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "5px 16px", borderRadius: 999,
            background: `${ACCENT}10`, border: `1px solid ${ACCENT}30`,
            color: ACCENT, fontSize: 11, fontWeight: 700,
            letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 20,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENT, animation: "pulse 2s ease-in-out infinite" }} />
            Immigration Intelligence · EB-1 Profile Engine
          </div>

          <h1 style={{
            fontSize: "clamp(26px, 4.5vw, 46px)", fontWeight: 800,
            color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: 16,
          }}>
            Build Your Immigration Profile{" "}
            <span style={{
              background: `linear-gradient(135deg, ${ACCENT}, #ec4899)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              Like a Top 1% Candidate
            </span>
          </h1>

          <p style={{ fontSize: 16, color: "rgba(148,163,184,0.8)", maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
            Enter your profile across four dimensions. Our AI scores your EB-1 readiness,
            identifies gaps, and rewrites your achievements in attorney-grade language.
          </p>
        </motion.div>

        {/* ── Results View ─────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.5 }}
            >
              {/* Score cards row */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 3, height: 20, borderRadius: 2, background: ACCENT }} />
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>EB-1 Readiness Scores</h2>
                  <div style={{
                    marginLeft: "auto", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
                    color: result.scores.overall_score >= 70 ? "#10b981" : result.scores.overall_score >= 50 ? "#f59e0b" : "#ef4444",
                    background: result.scores.overall_score >= 70 ? "rgba(16,185,129,0.1)" : result.scores.overall_score >= 50 ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)",
                    border: `1px solid ${result.scores.overall_score >= 70 ? "rgba(16,185,129,0.3)" : result.scores.overall_score >= 50 ? "rgba(245,158,11,0.3)" : "rgba(239,68,68,0.3)"}`,
                    borderRadius: 999, padding: "3px 12px",
                  }}>
                    {result.scores.overall_score >= 70 ? "EB-1 Ready" : result.scores.overall_score >= 50 ? "Needs Strengthening" : "Early Stage"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <ScoreRing score={result.scores.overall_score} label="Overall" color={ACCENT} delay={0} />
                  <ScoreRing score={result.scores.leadership_score} label="Leadership" color="#6366f1" delay={0.1} />
                  <ScoreRing score={result.scores.impact_score} label="Impact" color="#00d4ff" delay={0.2} />
                  <ScoreRing score={result.scores.research_score} label="Research" color="#10b981" delay={0.3} />
                </div>
              </div>

              {/* Gap analysis */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                style={{
                  padding: "24px", borderRadius: 16,
                  background: "rgba(10,12,20,0.8)", border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(12px)", marginBottom: 24,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 3, height: 20, borderRadius: 2, background: "#f59e0b" }} />
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>EB-1 Criteria Gap Analysis</h2>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {result.aiAnalysis.gap_analysis.map((item, i) => (
                    <GapCard key={item.area} item={item} index={i} />
                  ))}
                </div>
              </motion.div>

              {/* AI rewritten achievements */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
                style={{
                  padding: "24px", borderRadius: 16,
                  background: `linear-gradient(135deg, ${ACCENT}08, rgba(236,72,153,0.05))`,
                  border: `1px solid ${ACCENT}20`,
                  backdropFilter: "blur(12px)", marginBottom: 24,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 3, height: 20, borderRadius: 2, background: ACCENT }} />
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>AI-Rewritten EB-1 Achievements</h2>
                  <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: ACCENT, background: `${ACCENT}15`, border: `1px solid ${ACCENT}30`, borderRadius: 999, padding: "2px 8px" }}>
                    Attorney-Grade
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {result.aiAnalysis.rewritten_profile.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.4 + i * 0.06 }}
                      style={{
                        display: "flex", gap: 14, alignItems: "flex-start",
                        padding: "12px 16px", borderRadius: 10,
                        background: "rgba(10,12,20,0.6)", border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div style={{
                        width: 22, height: 22, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                        background: `linear-gradient(135deg, ${ACCENT}40, ${ACCENT}20)`,
                        border: `1px solid ${ACCENT}40`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 700, color: ACCENT,
                      }}>
                        {i + 1}
                      </div>
                      <p style={{ fontSize: 13.5, color: "rgba(226,232,240,0.85)", lineHeight: 1.65 }}>{item}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Improvement suggestions */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                style={{
                  padding: "24px", borderRadius: 16,
                  background: "rgba(10,12,20,0.8)", border: "1px solid rgba(99,102,241,0.2)",
                  backdropFilter: "blur(12px)", marginBottom: 32,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 3, height: 20, borderRadius: 2, background: "#6366f1" }} />
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Improvement Roadmap</h2>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {result.aiAnalysis.improvement_suggestions.map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.55 + i * 0.06 }}
                      style={{
                        display: "flex", gap: 14, alignItems: "flex-start",
                        padding: "12px 16px", borderRadius: 10,
                        background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)",
                      }}
                    >
                      <div style={{
                        width: 22, height: 22, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                        background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.35)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 700, color: "#818cf8",
                      }}>
                        {i + 1}
                      </div>
                      <p style={{ fontSize: 13.5, color: "rgba(226,232,240,0.8)", lineHeight: 1.65 }}>{s}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Re-analyze button */}
              <div style={{ display: "flex", justifyContent: "center" }}>
                <motion.button
                  onClick={resetForm}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    padding: "13px 32px", borderRadius: 12,
                    border: `1px solid ${ACCENT}40`,
                    background: `${ACCENT}10`,
                    color: ACCENT, fontSize: 14, fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  ← Analyze a Different Profile
                </motion.button>
              </div>
            </motion.div>

          ) : (
            /* ── Form View ──────────────────────────────────────────────────── */
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.45 }}
            >
              {/* Step indicator */}
              <div style={{ marginBottom: 36 }}>
                {/* Progress bar */}
                <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 16 }}>
                  {STEPS.map((s, i) => {
                    const filled = form[s.field].trim().length > 0;
                    const active = currentStep === s.number;
                    const done = currentStep > s.number || filled;
                    return (
                      <div key={s.number} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                        <button
                          onClick={() => setCurrentStep(s.number)}
                          style={{
                            width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                            border: `2px solid ${active ? ACCENT : done ? ACCENT + "60" : "rgba(255,255,255,0.15)"}`,
                            background: active ? ACCENT : done ? `${ACCENT}25` : "rgba(10,12,20,0.8)",
                            color: active ? "#fff" : done ? ACCENT : "rgba(148,163,184,0.5)",
                            fontSize: 12, fontWeight: 700, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.2s ease",
                          }}
                        >
                          {done && !active ? (
                            <svg width={14} height={14} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : s.number}
                        </button>
                        {i < STEPS.length - 1 && (
                          <div style={{
                            flex: 1, height: 2, borderRadius: 1,
                            background: currentStep > s.number ? `linear-gradient(90deg, ${ACCENT}60, ${ACCENT}30)` : "rgba(255,255,255,0.07)",
                            transition: "background 0.3s ease",
                          }} />
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Step labels */}
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  {STEPS.map((s) => (
                    <div key={s.number} style={{ textAlign: "center", flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: currentStep === s.number ? ACCENT : "rgba(148,163,184,0.5)", transition: "color 0.2s" }}>
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Name + Email (shown only on step 1) */}
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="identity"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                    style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}
                  >
                    {(["name", "email"] as const).map((field) => (
                      <div key={field}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#cbd5e1", marginBottom: 8 }}>
                          {field === "name" ? "Full Name" : "Email"}{" "}
                          <span style={{ color: "#475569", fontWeight: 400 }}>(optional)</span>
                        </label>
                        <input
                          type={field === "email" ? "email" : "text"}
                          name={field}
                          value={form[field]}
                          onChange={handleChange}
                          onFocus={() => setFocusedField(field)}
                          onBlur={() => setFocusedField(null)}
                          placeholder={field === "name" ? "Dr. Alex Chen" : "you@example.com"}
                          style={{
                            width: "100%", padding: "11px 14px", borderRadius: 10,
                            border: `1px solid ${focusedField === field ? `${ACCENT}80` : "rgba(255,255,255,0.1)"}`,
                            background: "#0d1017", color: "#fff", fontSize: 14, outline: "none",
                            boxShadow: focusedField === field ? `0 0 0 3px ${ACCENT}12` : "none",
                            transition: "border-color 0.2s, box-shadow 0.2s", boxSizing: "border-box",
                          }}
                        />
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Active step textarea */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`step-${currentStep}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    borderRadius: 16,
                    border: `1px solid ${focusedField === stepConfig.field ? `${ACCENT}50` : form[stepConfig.field].trim() ? `${ACCENT}25` : "rgba(255,255,255,0.1)"}`,
                    background: "#0d1017", overflow: "hidden",
                    boxShadow: focusedField === stepConfig.field ? `0 0 0 3px ${ACCENT}08, 0 0 24px ${ACCENT}08` : "none",
                    transition: "border-color 0.2s, box-shadow 0.2s", marginBottom: 20,
                  }}
                >
                  {/* Section header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: focusedField === stepConfig.field || form[stepConfig.field].trim() ? `${ACCENT}18` : "rgba(255,255,255,0.05)",
                        border: `1px solid ${focusedField === stepConfig.field || form[stepConfig.field].trim() ? `${ACCENT}35` : "rgba(255,255,255,0.07)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: focusedField === stepConfig.field || form[stepConfig.field].trim() ? ACCENT : "#64748b",
                        transition: "all 0.2s",
                      }}>
                        {stepConfig.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>
                          Step {stepConfig.number}: {stepConfig.label}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{stepConfig.sublabel}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {form[stepConfig.field].trim() && (
                        <span style={{ fontSize: 11, color: "#10b981", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 999, padding: "2px 8px" }}>
                          ✓ Filled
                        </span>
                      )}
                      <span style={{ fontSize: 12, color: form[stepConfig.field].length > stepConfig.limit * 0.9 ? "#ef4444" : "#475569" }}>
                        {form[stepConfig.field].length}/{stepConfig.limit}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: 12, color: "#475569", padding: "8px 22px 0", lineHeight: 1.5 }}>{stepConfig.hint}</p>

                  <div style={{ padding: "10px 22px 18px" }}>
                    <textarea
                      name={stepConfig.field}
                      value={form[stepConfig.field]}
                      onChange={handleChange}
                      onFocus={() => setFocusedField(stepConfig.field)}
                      onBlur={() => setFocusedField(null)}
                      placeholder={stepConfig.placeholder}
                      maxLength={stepConfig.limit}
                      rows={7}
                      style={{
                        width: "100%", padding: "12px 14px", borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.07)",
                        background: "#070a10", color: "#e2e8f0", fontSize: 13,
                        lineHeight: 1.7, resize: "vertical", outline: "none",
                        fontFamily: "var(--font-geist-mono, monospace)",
                        boxSizing: "border-box", minHeight: 150,
                      }}
                    />
                    {/* Character bar */}
                    <div style={{ marginTop: 8, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 2,
                        width: `${Math.min((form[stepConfig.field].length / stepConfig.limit) * 100, 100)}%`,
                        background: form[stepConfig.field].length > stepConfig.limit * 0.9
                          ? "#ef4444"
                          : form[stepConfig.field].length > stepConfig.limit * 0.7
                          ? "#f59e0b"
                          : `linear-gradient(90deg, ${ACCENT}80, ${ACCENT})`,
                        transition: "width 0.3s ease, background 0.3s ease",
                      }} />
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5", fontSize: 13, marginBottom: 16 }}
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation buttons */}
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                {currentStep > 1 && (
                  <motion.button
                    onClick={() => setCurrentStep((s) => (s - 1) as 1 | 2 | 3 | 4)}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    style={{
                      padding: "13px 24px", borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.04)",
                      color: "rgba(148,163,184,0.8)", fontSize: 14, fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    ← Back
                  </motion.button>
                )}

                {currentStep < 4 ? (
                  <motion.button
                    onClick={() => { if (canGoNext()) setCurrentStep((s) => (s + 1) as 1 | 2 | 3 | 4); }}
                    whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}
                    style={{
                      flex: 1, padding: "14px 24px", borderRadius: 12, border: "none",
                      background: `linear-gradient(135deg, ${ACCENT}cc, ${ACCENT})`,
                      color: "#fff", fontSize: 15, fontWeight: 700,
                      cursor: "pointer",
                      boxShadow: `0 4px 20px ${ACCENT}35`,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}
                  >
                    Next: {STEPS[currentStep].label}
                    <svg width={16} height={16} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={handleSubmit}
                    disabled={loading}
                    whileHover={!loading ? { scale: 1.015 } : {}}
                    whileTap={!loading ? { scale: 0.985 } : {}}
                    style={{
                      flex: 1, padding: "16px 24px", borderRadius: 12, border: "none",
                      background: loading
                        ? `${ACCENT}50`
                        : `linear-gradient(135deg, ${ACCENT} 0%, #ec4899 50%, #f97316 100%)`,
                      color: "#fff", fontSize: 16, fontWeight: 700,
                      cursor: loading ? "not-allowed" : "pointer",
                      boxShadow: loading ? "none" : `0 4px 28px ${ACCENT}45`,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                      position: "relative", overflow: "hidden",
                    }}
                  >
                    {!loading && (
                      <span style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)", animation: "shimmer 2.5s infinite" }} />
                    )}
                    <span style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 10 }}>
                      {loading ? (
                        <>
                          <svg style={{ width: 20, height: 20, animation: "spin 1s linear infinite" }} fill="none" viewBox="0 0 24 24">
                            <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                            <path style={{ opacity: 0.9 }} fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Analyzing your profile with AI...
                        </>
                      ) : (
                        <>
                          <svg width={20} height={20} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          Analyze Profile
                        </>
                      )}
                    </span>
                  </motion.button>
                )}
              </div>

              {/* Progress summary */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16 }}>
                {STEPS.map((s) => (
                  <div key={s.number} style={{
                    height: 4, borderRadius: 2,
                    width: currentStep === s.number ? 24 : 12,
                    background: form[s.field].trim() ? ACCENT : currentStep === s.number ? `${ACCENT}60` : "rgba(255,255,255,0.1)",
                    transition: "all 0.3s ease",
                  }} />
                ))}
                <span style={{ fontSize: 12, color: "#475569", marginLeft: 8 }}>{filledSteps}/4 sections filled</span>
              </div>

              <p style={{ textAlign: "center", fontSize: 12, color: "#334155", marginTop: 12 }}>
                Data is processed in-session only. Not legal advice.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        textarea::placeholder { color: #2d3748; }
        input::placeholder { color: #2d3748; }
      `}</style>
    </div>
  );
}
