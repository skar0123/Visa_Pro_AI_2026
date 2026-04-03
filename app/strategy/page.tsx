"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import type { EvaluationResult, RoadmapItem } from "@/lib/ai";

const TIMELINE_CONFIG = {
  "3mo": { label: "0–3 Months", color: "#00d4ff", bg: "rgba(0,212,255,0.08)", border: "rgba(0,212,255,0.25)" },
  "6mo": { label: "3–6 Months", color: "#0099ff", bg: "rgba(0,153,255,0.08)", border: "rgba(0,153,255,0.25)" },
  "1yr": { label: "6–12 Months", color: "#8b5cf6", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.25)" },
} as const;

const CATEGORY_ICONS: Record<string, string> = {
  credential: "🎓",
  publication: "📄",
  recognition: "🏆",
  legal: "⚖️",
  network: "🤝",
  documentation: "📋",
};

const EFFORT_COLORS: Record<string, string> = {
  Low: "#22c55e",
  Medium: "#f59e0b",
  High: "#ef4444",
};

function RoadmapCard({ item, index }: { item: RoadmapItem; index: number }) {
  const tc = TIMELINE_CONFIG[item.timeline];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      style={{
        background: "rgba(13,16,23,0.8)",
        border: `1px solid ${tc.border}`,
        borderRadius: 16,
        padding: "20px 24px",
        marginBottom: 12,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: tc.color,
          borderRadius: "4px 0 0 4px",
        }}
      />
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginLeft: 8 }}>
        <div style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>
          {CATEGORY_ICONS[item.category] || "📌"}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: tc.color,
                background: tc.bg,
                padding: "2px 8px",
                borderRadius: 20,
              }}
            >
              {item.category}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: EFFORT_COLORS[item.effort],
                background: `${EFFORT_COLORS[item.effort]}15`,
                padding: "2px 8px",
                borderRadius: 20,
              }}
            >
              {item.effort} effort
            </span>
          </div>
          <p style={{ color: "#e2e8f0", fontSize: 14, lineHeight: 1.7, margin: "0 0 10px" }}>
            {item.action}
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              background: "rgba(0,212,255,0.04)",
              border: "1px solid rgba(0,212,255,0.1)",
              borderRadius: 8,
              padding: "8px 12px",
            }}
          >
            <span style={{ color: "#00d4ff", flexShrink: 0, fontSize: 13 }}>→</span>
            <p style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.6, margin: 0 }}>
              <strong style={{ color: "#00d4ff" }}>Impact:</strong> {item.impact}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function StrategyPage() {
  const router = useRouter();
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);
  const [activeTab, setActiveTab] = useState<"3mo" | "6mo" | "1yr">("3mo");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = sessionStorage.getItem("visapro_result");
    if (!raw) { router.push("/dashboard"); return; }

    try {
      const parsed: EvaluationResult & { roadmap?: RoadmapItem[] } = JSON.parse(raw);
      setResult(parsed);
      if (parsed.roadmap) {
        setRoadmap(parsed.roadmap);
      }
    } catch {
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#03050f", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#00d4ff", fontSize: 16 }}>Loading strategy...</div>
      </div>
    );
  }

  if (!result) return null;

  const byTimeline = (t: "3mo" | "6mo" | "1yr") => roadmap.filter((item) => item.timeline === t);

  const tabItems = byTimeline(activeTab);

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#03050f", color: "#fff", paddingTop: 80 }}>
      <Navbar />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 36 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "linear-gradient(135deg, #0066ff, #00d4ff)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              🗺️
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Visa Strategy Roadmap</h1>
              <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
                Personalized 12-month immigration preparation plan
              </p>
            </div>
          </div>

          {roadmap.length === 0 && (
            <div
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 12,
                padding: "16px 20px",
                color: "#fca5a5",
                fontSize: 14,
              }}
            >
              No roadmap data found. Please{" "}
              <a href="/dashboard" style={{ color: "#00d4ff" }}>
                run a profile evaluation
              </a>{" "}
              first.
            </div>
          )}
        </motion.div>

        {roadmap.length > 0 && (
          <>
            {/* Timeline tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
              {(["3mo", "6mo", "1yr"] as const).map((t) => {
                const tc = TIMELINE_CONFIG[t];
                const count = byTimeline(t).length;
                return (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      borderRadius: 12,
                      border: `1px solid ${activeTab === t ? tc.border : "rgba(255,255,255,0.06)"}`,
                      background: activeTab === t ? tc.bg : "rgba(13,16,23,0.6)",
                      color: activeTab === t ? tc.color : "#64748b",
                      fontWeight: activeTab === t ? 600 : 400,
                      cursor: "pointer",
                      fontSize: 13,
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ fontSize: 16, marginBottom: 2 }}>{tc.label}</div>
                    <div style={{ fontSize: 11, opacity: 0.7 }}>{count} action{count !== 1 ? "s" : ""}</div>
                  </button>
                );
              })}
            </div>

            {/* Roadmap items */}
            <div>
              {tabItems.length === 0 ? (
                <div style={{ textAlign: "center", color: "#64748b", padding: "40px 0", fontSize: 14 }}>
                  No actions for this period — your profile is strong in this window!
                </div>
              ) : (
                tabItems.map((item, i) => (
                  <RoadmapCard key={i} item={item} index={i} />
                ))
              )}
            </div>

            {/* Summary stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{
                marginTop: 32,
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12,
              }}
            >
              {(["3mo", "6mo", "1yr"] as const).map((t) => {
                const tc = TIMELINE_CONFIG[t];
                const items = byTimeline(t);
                const highEffort = items.filter((i) => i.effort === "High").length;
                return (
                  <div
                    key={t}
                    style={{
                      background: "rgba(13,16,23,0.6)",
                      border: `1px solid ${tc.border}`,
                      borderRadius: 12,
                      padding: "16px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 22, fontWeight: 700, color: tc.color }}>{items.length}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{tc.label} actions</div>
                    {highEffort > 0 && (
                      <div style={{ fontSize: 10, color: "#ef4444", marginTop: 4 }}>
                        {highEffort} high effort
                      </div>
                    )}
                  </div>
                );
              })}
            </motion.div>

            <div style={{ marginTop: 24, textAlign: "center" }}>
              <a
                href="/dashboard"
                style={{
                  color: "#00d4ff",
                  fontSize: 13,
                  textDecoration: "none",
                  borderBottom: "1px solid rgba(0,212,255,0.3)",
                  paddingBottom: 1,
                }}
              >
                ← Run a new evaluation
              </a>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
