"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VISA_DISPLAY, type VisaTypeKey } from "@/lib/benchmarkProfiles";
import type { BenchmarkMetrics } from "@/lib/benchmarkProfiles";
import type { MetricGaps } from "@/lib/comparison";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ComparisonResult {
  visaType: VisaTypeKey;
  userMetrics: BenchmarkMetrics;
  benchmarkMetrics: BenchmarkMetrics;
  gaps: MetricGaps;
  percentile: number;
  metricPercentiles: Record<keyof BenchmarkMetrics, number>;
  tier: "strong" | "average" | "below";
  summary: string;
}

// ─── Metric config ────────────────────────────────────────────────────────────

const METRIC_CONFIG: {
  key: keyof BenchmarkMetrics;
  label: string;
  unit: string;
  tooltip: string;
  isBinary: boolean;
}[] = [
  {
    key: "publications",
    label: "Publications",
    unit: "papers",
    tooltip: "Peer-reviewed papers, conference proceedings, and published articles. One of the strongest EB-1A/O-1A criteria (8 C.F.R. § 204.5(h)(3)(vi)).",
    isBinary: false,
  },
  {
    key: "citations",
    label: "Citations",
    unit: "total",
    tooltip: "Total citations to your work across Google Scholar, Semantic Scholar, etc. Demonstrates influence and peer recognition of your contributions.",
    isBinary: false,
  },
  {
    key: "awards_level",
    label: "Award Level",
    unit: "/ 5",
    tooltip: "0 = none · 1 = local/minor · 2 = competitive fellowship or grant · 3 = major national (NSF/NIH/IEEE) · 4 = international · 5 = Nobel/Turing tier. Satisfies 8 C.F.R. § 204.5(h)(3)(i).",
    isBinary: false,
  },
  {
    key: "media_mentions",
    label: "Media Mentions",
    unit: "outlets",
    tooltip: "Distinct recognized media outlets that have featured you or your work. Satisfies 8 C.F.R. § 204.5(h)(3)(iii) — published material about you in professional or major trade publications.",
    isBinary: false,
  },
  {
    key: "judging_experience",
    label: "Judging / Peer Review",
    unit: "",
    tooltip: "Serving as a judge, reviewer, editorial board member, or grant reviewer for your field. Directly satisfies 8 C.F.R. § 204.5(h)(3)(iv). One of the easiest criteria to earn proactively.",
    isBinary: true,
  },
  {
    key: "leadership_roles",
    label: "Leadership Seniority",
    unit: "",
    tooltip: "Director, VP, Principal, Distinguished Engineer, Fellow, or equivalent senior title at a recognized organization. Supports the critical role criterion under 8 C.F.R. § 204.5(h)(3)(viii).",
    isBinary: true,
  },
  {
    key: "experience_years",
    label: "Experience",
    unit: "years",
    tooltip: "Total years of professional experience in the field. Sustained career trajectory is a soft factor USCIS considers alongside the formal criteria.",
    isBinary: false,
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function PercentileBadge({ percentile, tier }: { percentile: number; tier: "strong" | "average" | "below" }) {
  const config = {
    strong:  { color: "#10b981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.3)",  label: "Top 30%", sub: "Strong candidate" },
    average: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.3)",  label: "Average",  sub: "Developing profile" },
    below:   { color: "#ef4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.3)",   label: "Below avg", sub: "Significant gaps" },
  }[tier];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: 96,
        height: 96,
        borderRadius: "50%",
        background: config.bg,
        border: `2px solid ${config.border}`,
        flexShrink: 0,
      }}
    >
      <div style={{ fontSize: 26, fontWeight: 800, color: config.color, lineHeight: 1 }}>{percentile}</div>
      <div style={{ fontSize: 9, color: config.color, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>PERCENTILE</div>
      <div style={{ fontSize: 9, color: `${config.color}99`, marginTop: 2 }}>{config.label}</div>
    </div>
  );
}

function MetricRow({
  cfg,
  userVal,
  benchVal,
  gap,
  percentileVal,
  delay,
}: {
  cfg: (typeof METRIC_CONFIG)[number];
  userVal: number;
  benchVal: number;
  gap: number;
  percentileVal: number;
  delay: number;
}) {
  const [barW, setBarW] = useState(0);
  const [benchBarW, setBenchBarW] = useState(0);
  const [showTip, setShowTip] = useState(false);

  const isAbove = gap >= 0;
  const statusColor  = isAbove ? "#10b981" : "#ef4444";
  const statusSymbol = isAbove ? "↑" : "↓";

  // Normalize bar widths (cap at 100%)
  const maxVal = Math.max(userVal, benchVal, 1);
  const userPct  = Math.round((userVal  / maxVal) * 100);
  const benchPct = Math.round((benchVal / maxVal) * 100);

  const formatVal = (v: number) =>
    cfg.isBinary ? (v >= 1 ? "Yes" : "No") : cfg.unit === "/ 5" ? `${v}/5` : `${v}${cfg.unit ? " " + cfg.unit : ""}`;

  useEffect(() => {
    const t = setTimeout(() => { setBarW(userPct); setBenchBarW(benchPct); }, delay);
    return () => clearTimeout(t);
  }, [userPct, benchPct, delay]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay / 1000, duration: 0.35 }}
      style={{
        display: "grid",
        gridTemplateColumns: "160px 1fr 90px 80px",
        gap: 16,
        alignItems: "center",
        padding: "14px 0",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        position: "relative",
      }}
    >
      {/* Label + tooltip */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 13, color: "#cbd5e1", fontWeight: 500 }}>{cfg.label}</span>
        <button
          onMouseEnter={() => setShowTip(true)}
          onMouseLeave={() => setShowTip(false)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", fontSize: 13, lineHeight: 1, padding: 0, flexShrink: 0 }}
        >
          ⓘ
        </button>
        {showTip && (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: "calc(100% + 4px)",
              zIndex: 20,
              background: "rgba(10,12,22,0.98)",
              border: "1px solid rgba(0,212,255,0.2)",
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: 11,
              color: "#94a3b8",
              lineHeight: 1.6,
              maxWidth: 300,
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
          >
            {cfg.tooltip}
          </div>
        )}
      </div>

      {/* Bar comparison */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {/* User bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, fontSize: 10, color: "#64748b", textAlign: "right", flexShrink: 0 }}>You</div>
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${barW}%`, borderRadius: 3, background: isAbove ? "linear-gradient(90deg, #10b98155, #10b981)" : "linear-gradient(90deg, #ef444455, #ef4444)", transition: "width 1s cubic-bezier(0.22,1,0.36,1)" }} />
          </div>
          <div style={{ width: 52, fontSize: 12, color: isAbove ? "#10b981" : "#fca5a5", fontWeight: 600, textAlign: "right", flexShrink: 0 }}>
            {formatVal(userVal)}
          </div>
        </div>
        {/* Benchmark bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, fontSize: 10, color: "#475569", textAlign: "right", flexShrink: 0 }}>Avg</div>
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${benchBarW}%`, borderRadius: 3, background: "rgba(100,116,139,0.5)", transition: "width 1s cubic-bezier(0.22,1,0.36,1) 0.15s" }} />
          </div>
          <div style={{ width: 52, fontSize: 12, color: "#64748b", textAlign: "right", flexShrink: 0 }}>
            {formatVal(benchVal)}
          </div>
        </div>
      </div>

      {/* Status */}
      <div style={{ textAlign: "center" }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: statusColor,
            background: `${statusColor}15`,
            border: `1px solid ${statusColor}35`,
            borderRadius: 20,
            padding: "3px 10px",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            whiteSpace: "nowrap",
          }}
        >
          {isAbove ? "✅" : "❌"} {statusSymbol} {isAbove ? "Above" : "Below"}
        </span>
      </div>

      {/* Percentile */}
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: percentileVal >= 60 ? "#10b981" : percentileVal >= 40 ? "#f59e0b" : "#ef4444" }}>
          {percentileVal}
          <span style={{ fontSize: 10, fontWeight: 500, color: "#475569" }}>th %ile</span>
        </div>
      </div>
    </motion.div>
  );
}

function VisaTypeTab({ type, active, onClick }: { type: VisaTypeKey; active: boolean; onClick: () => void }) {
  const d = VISA_DISPLAY[type];
  return (
    <button
      onClick={onClick}
      style={{
        padding: "9px 16px",
        borderRadius: 10,
        border: `1px solid ${active ? d.color + "50" : "rgba(255,255,255,0.08)"}`,
        background: active ? `${d.color}10` : "transparent",
        color: active ? d.color : "rgba(100,116,139,0.7)",
        fontSize: 13,
        fontWeight: active ? 700 : 400,
        cursor: "pointer",
        transition: "all 0.18s ease",
        whiteSpace: "nowrap",
      }}
    >
      {d.label}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ComparisonPanel() {
  const [visaType, setVisaType] = useState<VisaTypeKey>("EB1A");
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState<Partial<Record<VisaTypeKey, ComparisonResult>>>({});

  async function fetchComparison(vt: VisaTypeKey) {
    if (fetched[vt]) { setResult(fetched[vt]!); return; }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const raw = sessionStorage.getItem("visapro_profile");
      if (!raw) { setError("Profile data not found. Please run an evaluation first."); setLoading(false); return; }
      const profile = JSON.parse(raw);

      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...profile, visaType: vt }),
      });
      if (!res.ok) { throw new Error("Comparison failed."); }
      const data: ComparisonResult = await res.json();
      setFetched((prev) => ({ ...prev, [vt]: data }));
      setResult(data);
    } catch {
      setError("Unable to load comparison. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Initial load
  useEffect(() => { fetchComparison("EB1A"); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleVisaChange(vt: VisaTypeKey) {
    setVisaType(vt);
    fetchComparison(vt);
  }

  // Determine best and worst metric from current result
  const ranked = result
    ? Object.entries(result.metricPercentiles).sort(([, a], [, b]) => b - a)
    : [];
  const bestKey  = ranked[0]?.[0] as keyof BenchmarkMetrics | undefined;
  const worstKey = ranked[ranked.length - 1]?.[0] as keyof BenchmarkMetrics | undefined;
  const bestLabel  = METRIC_CONFIG.find((m) => m.key === bestKey)?.label;
  const worstLabel = METRIC_CONFIG.find((m) => m.key === worstKey)?.label;

  const vd = VISA_DISPLAY[visaType];

  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "#0d1017",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(0,212,255,0.12)", border: "1px solid rgba(0,212,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
              📊
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>How You Compare</h2>
            <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.18)", color: "#00d4ff", letterSpacing: "0.05em" }}>
              CASE COMPARISON ENGINE
            </span>
          </div>
          <p style={{ fontSize: 12, color: "rgba(100,116,139,0.7)", margin: 0 }}>
            Your profile vs the median approved {vd.label} petitioner. {vd.description}.
          </p>
        </div>

        {/* Visa type tabs */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(["EB1A", "O1", "EB2_NIW"] as VisaTypeKey[]).map((vt) => (
            <VisaTypeTab key={vt} type={vt} active={visaType === vt} onClick={() => handleVisaChange(vt)} />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ padding: "48px 24px", textAlign: "center", color: "#475569" }}
          >
            <svg style={{ width: 32, height: 32, animation: "spin 1s linear infinite", margin: "0 auto 12px" }} fill="none" viewBox="0 0 24 24">
              <circle style={{ opacity: 0.2 }} cx="12" cy="12" r="10" stroke="#00d4ff" strokeWidth="3" />
              <path style={{ opacity: 0.8 }} fill="#00d4ff" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <div style={{ fontSize: 13 }}>Comparing your profile…</div>
          </motion.div>
        )}

        {error && !loading && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ padding: "32px 24px", textAlign: "center", color: "#fca5a5", fontSize: 13 }}
          >
            {error}
          </motion.div>
        )}

        {result && !loading && (
          <motion.div
            key={`result-${visaType}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Overall percentile + summary */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "flex-start",
                gap: 20,
                flexWrap: "wrap",
              }}
            >
              <PercentileBadge percentile={result.percentile} tier={result.tier} />

              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                  {bestLabel && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981" }}>
                      ✅ Strongest: {bestLabel}
                    </span>
                  )}
                  {worstLabel && worstKey !== bestKey && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
                      ❌ Weakest: {worstLabel}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7, margin: 0 }}>
                  {result.summary}
                </p>
              </div>
            </div>

            {/* Premium positioning tags */}
            <div style={{ padding: "12px 24px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["Attorney-level insights", "Used for EB-1A / O-1 success strategy", "Deep AI-driven evaluation engine"].map((tag) => (
                <span key={tag} style={{ fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(148,163,184,0.6)" }}>
                  {tag}
                </span>
              ))}
            </div>

            {/* Metric table header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "160px 1fr 90px 80px",
                gap: 16,
                padding: "10px 24px 6px",
                fontSize: 10,
                fontWeight: 600,
                color: "#475569",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              <div>Criterion</div>
              <div>You vs Approved {vd.label} Median</div>
              <div style={{ textAlign: "center" }}>Status</div>
              <div style={{ textAlign: "right" }}>Percentile</div>
            </div>

            {/* Metric rows */}
            <div style={{ padding: "0 24px 16px" }}>
              {METRIC_CONFIG.map((cfg, i) => (
                <MetricRow
                  key={cfg.key}
                  cfg={cfg}
                  userVal={result.userMetrics[cfg.key]}
                  benchVal={result.benchmarkMetrics[cfg.key]}
                  gap={result.gaps[cfg.key]}
                  percentileVal={result.metricPercentiles[cfg.key]}
                  delay={100 + i * 80}
                />
              ))}
            </div>

            {/* Footer note */}
            <div style={{ padding: "12px 24px 16px", borderTop: "1px solid rgba(255,255,255,0.04)", fontSize: 11, color: "rgba(100,116,139,0.5)", lineHeight: 1.6 }}>
              Benchmarks reflect median approved petitioner profiles based on published USCIS data and immigration practice patterns. Metrics are extracted from your profile text — add explicit numbers (e.g. "published 8 papers", "200 citations") for more precise scoring. This is analytical guidance, not legal advice.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
