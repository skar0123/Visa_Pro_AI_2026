"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import type { EvaluationResult } from "@/lib/ai";

const STORAGE_KEY = "visapro_history";

interface HistoryEntry {
  id: string;
  timestamp: number;
  name: string;
  overall_score: number;
  visa_probabilities: EvaluationResult["visa_probabilities"];
  top_strength: string;
  top_gap: string;
}

function ScoreRing({ score, size = 64 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const color = score >= 75 ? "#22c55e" : score >= 55 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={4} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - score / 100)}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text x={size / 2} y={size / 2 + 5} textAnchor="middle" fontSize={13} fontWeight={700} fill={color}>
        {score}
      </text>
    </svg>
  );
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [selected, setSelected] = useState<HistoryEntry | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setEntries(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  function clearHistory() {
    if (!confirm("Delete all evaluation history?")) return;
    localStorage.removeItem(STORAGE_KEY);
    setEntries([]);
    setSelected(null);
  }

  function deleteEntry(id: string) {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (selected?.id === id) setSelected(null);
  }

  const visaColors = {
    EB1A: "#8b5cf6",
    EB2_NIW: "#0099ff",
    O1: "#00d4ff",
    EB5: "#f59e0b",
  };

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#03050f", color: "#fff", paddingTop: 80 }}>
      <Navbar />

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 20px" }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: "linear-gradient(135deg, #0066ff, #8b5cf6)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                }}
              >
                📊
              </div>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Evaluation History</h1>
                <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
                  {entries.length} saved evaluation{entries.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Link
                href="/dashboard"
                style={{
                  padding: "9px 18px",
                  borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(135deg, #0066ff, #00d4ff)",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 13,
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                + New Evaluation
              </Link>
              {entries.length > 0 && (
                <button
                  onClick={clearHistory}
                  style={{
                    padding: "9px 18px",
                    borderRadius: 10,
                    border: "1px solid rgba(239,68,68,0.2)",
                    background: "transparent",
                    color: "#ef4444",
                    fontWeight: 500,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {entries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              textAlign: "center",
              padding: "80px 20px",
              background: "rgba(13,16,23,0.6)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 20,
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <h2 style={{ color: "#94a3b8", fontWeight: 500, marginBottom: 8, fontSize: 18 }}>
              No evaluations yet
            </h2>
            <p style={{ color: "#475569", fontSize: 14, marginBottom: 24 }}>
              Complete a profile analysis to see your history here
            </p>
            <Link
              href="/dashboard"
              style={{
                padding: "12px 28px",
                borderRadius: 10,
                background: "linear-gradient(135deg, #0066ff, #00d4ff)",
                color: "#fff",
                fontWeight: 600,
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              Analyze My Profile →
            </Link>
          </motion.div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1fr" : "1fr", gap: 16 }}>
            {/* List */}
            <div>
              {entries.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelected(selected?.id === entry.id ? null : entry)}
                  style={{
                    background: selected?.id === entry.id ? "rgba(0,212,255,0.06)" : "rgba(13,16,23,0.8)",
                    border: `1px solid ${selected?.id === entry.id ? "rgba(0,212,255,0.2)" : "rgba(255,255,255,0.05)"}`,
                    borderRadius: 16,
                    padding: "18px 20px",
                    marginBottom: 10,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <ScoreRing score={entry.overall_score} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: 600, fontSize: 15, color: "#e2e8f0" }}>
                          {entry.name || "Anonymous"}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id); }}
                          style={{
                            background: "none", border: "none", color: "#475569",
                            cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 4,
                          }}
                          title="Delete"
                        >
                          ×
                        </button>
                      </div>
                      <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>
                        {formatDate(entry.timestamp)}
                      </div>
                      {/* Visa probability pills */}
                      <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                        {(["EB1A", "EB2_NIW", "O1", "EB5"] as const).map((visa) => {
                          const prob = entry.visa_probabilities[visa];
                          return (
                            <span
                              key={visa}
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                padding: "2px 8px",
                                borderRadius: 20,
                                color: visaColors[visa],
                                background: `${visaColors[visa]}15`,
                                border: `1px solid ${visaColors[visa]}30`,
                              }}
                            >
                              {visa === "EB2_NIW" ? "NIW" : visa} {prob}%
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Detail panel */}
            {selected && (
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  background: "rgba(13,16,23,0.9)",
                  border: "1px solid rgba(0,212,255,0.12)",
                  borderRadius: 20,
                  padding: 24,
                  alignSelf: "start",
                  position: "sticky",
                  top: 96,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <h3 style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>{selected.name || "Anonymous"}</h3>
                  <ScoreRing score={selected.overall_score} size={56} />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                    Visa Probabilities
                  </div>
                  {(["EB1A", "EB2_NIW", "O1", "EB5"] as const).map((visa) => {
                    const prob = selected.visa_probabilities[visa];
                    return (
                      <div key={visa} style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: "#94a3b8" }}>{visa === "EB2_NIW" ? "EB-2 NIW" : visa}</span>
                          <span style={{ fontSize: 12, color: visaColors[visa], fontWeight: 600 }}>{prob}%</span>
                        </div>
                        <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ width: `${prob}%`, height: "100%", background: visaColors[visa], borderRadius: 2, transition: "width 0.4s ease" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selected.top_strength && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                      Top Strength
                    </div>
                    <p style={{ fontSize: 12, color: "#22c55e", lineHeight: 1.6, margin: 0, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 8, padding: "10px 12px" }}>
                      {selected.top_strength.slice(0, 200)}...
                    </p>
                  </div>
                )}

                {selected.top_gap && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                      Key Gap
                    </div>
                    <p style={{ fontSize: 12, color: "#f87171", lineHeight: 1.6, margin: 0, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8, padding: "10px 12px" }}>
                      {selected.top_gap.slice(0, 200)}...
                    </p>
                  </div>
                )}

                <div style={{ color: "#475569", fontSize: 11 }}>{formatDate(selected.timestamp)}</div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
