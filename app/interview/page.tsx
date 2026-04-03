"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import type { EvaluationResult } from "@/lib/ai";

const VISA_TYPES = ["O-1A", "EB-1A", "EB-2 NIW"];
const CATEGORIES = [
  { value: "extraordinary", label: "Extraordinary Ability" },
  { value: "publications", label: "Publications & Research" },
  { value: "awards", label: "Awards & Recognition" },
  { value: "critical_role", label: "Critical Role" },
  { value: "salary", label: "High Salary" },
  { value: "judging", label: "Peer Review & Judging" },
  { value: "media", label: "Media & Press" },
];

interface QA {
  question: string;
  context: string;
  answer: string;
  score?: number;
  feedback?: string;
  suggestion?: string;
  evaluated: boolean;
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 8 ? "#22c55e" : score >= 6 ? "#f59e0b" : "#ef4444";
  const label = score >= 8 ? "Strong" : score >= 6 ? "Adequate" : "Needs Work";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        fontWeight: 600,
        color,
        background: `${color}15`,
        padding: "3px 10px",
        borderRadius: 20,
        border: `1px solid ${color}40`,
      }}
    >
      {score}/10 · {label}
    </span>
  );
}

export default function InterviewPage() {
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [selectedVisa, setSelectedVisa] = useState("O-1A");
  const [selectedCategory, setSelectedCategory] = useState("extraordinary");
  const [currentQA, setCurrentQA] = useState<QA | null>(null);
  const [history, setHistory] = useState<QA[]>([]);
  const [answer, setAnswer] = useState("");
  const [loadingQ, setLoadingQ] = useState(false);
  const [loadingEval, setLoadingEval] = useState(false);
  const [started, setStarted] = useState(false);
  const answerRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("visapro_result");
    if (raw) {
      try { setResult(JSON.parse(raw)); } catch { /* ignore */ }
    }
  }, []);

  const profile = result
    ? { education: "", experience: "", skills: "" }
    : { education: "", experience: "", skills: "" };

  async function fetchQuestion() {
    setLoadingQ(true);
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get_question",
          visaType: selectedVisa,
          category: selectedCategory,
          profile,
          previousQuestions: history.map((h) => h.question),
        }),
      });
      const data = await res.json();
      setCurrentQA({ question: data.question, context: data.context, answer: "", evaluated: false });
      setAnswer("");
      setTimeout(() => answerRef.current?.focus(), 100);
    } catch {
      // ignore
    } finally {
      setLoadingQ(false);
    }
  }

  async function submitAnswer() {
    if (!currentQA || !answer.trim()) return;
    setLoadingEval(true);
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluate_answer",
          visaType: selectedVisa,
          question: currentQA.question,
          answer,
        }),
      });
      const data = await res.json();
      const evaluated: QA = {
        ...currentQA,
        answer,
        score: data.score,
        feedback: data.feedback,
        suggestion: data.suggestion,
        evaluated: true,
      };
      setCurrentQA(evaluated);
      setHistory((prev) => [evaluated, ...prev]);
    } catch {
      // ignore
    } finally {
      setLoadingEval(false);
    }
  }

  const avgScore = history.filter((h) => h.score !== undefined).length > 0
    ? Math.round(history.filter((h) => h.score !== undefined).reduce((s, h) => s + (h.score ?? 0), 0) / history.filter((h) => h.score !== undefined).length * 10) / 10
    : null;

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#03050f", color: "#fff", paddingTop: 80 }}>
      <Navbar />

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 20px" }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div
              style={{
                width: 40, height: 40, borderRadius: 10,
                background: "linear-gradient(135deg, #8b5cf6, #00d4ff)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
              }}
            >
              🎤
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>AI Interview Simulator</h1>
              <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
                Practice answering USCIS-style interview questions for your visa petition
              </p>
            </div>
          </div>

          {avgScore !== null && (
            <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
              <div style={{ background: "rgba(13,16,23,0.8)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 10, padding: "10px 16px" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#00d4ff" }}>{avgScore}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>Avg Score / 10</div>
              </div>
              <div style={{ background: "rgba(13,16,23,0.8)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 10, padding: "10px 16px" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#8b5cf6" }}>{history.length}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>Questions Practiced</div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Config panel */}
        {!started ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: "rgba(13,16,23,0.9)",
              border: "1px solid rgba(0,212,255,0.12)",
              borderRadius: 20,
              padding: 32,
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: "#e2e8f0" }}>
              Configure Your Practice Session
            </h2>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>
                Visa Category
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {VISA_TYPES.map((vt) => (
                  <button
                    key={vt}
                    onClick={() => setSelectedVisa(vt)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 8,
                      border: `1px solid ${selectedVisa === vt ? "rgba(0,212,255,0.4)" : "rgba(255,255,255,0.08)"}`,
                      background: selectedVisa === vt ? "rgba(0,212,255,0.1)" : "transparent",
                      color: selectedVisa === vt ? "#00d4ff" : "#64748b",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: selectedVisa === vt ? 600 : 400,
                    }}
                  >
                    {vt}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>
                Focus Area
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: `1px solid ${selectedCategory === cat.value ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.06)"}`,
                      background: selectedCategory === cat.value ? "rgba(139,92,246,0.08)" : "rgba(13,16,23,0.6)",
                      color: selectedCategory === cat.value ? "#a78bfa" : "#64748b",
                      cursor: "pointer",
                      fontSize: 13,
                      textAlign: "left",
                      fontWeight: selectedCategory === cat.value ? 600 : 400,
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => { setStarted(true); fetchQuestion(); }}
              style={{
                padding: "14px 32px",
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg, #0066ff, #00d4ff)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
                width: "100%",
              }}
            >
              Start Practice Session →
            </button>
          </motion.div>
        ) : (
          <div>
            {/* Question area */}
            <AnimatePresence mode="wait">
              {loadingQ ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    background: "rgba(13,16,23,0.9)",
                    border: "1px solid rgba(0,212,255,0.12)",
                    borderRadius: 20,
                    padding: 40,
                    textAlign: "center",
                    color: "#64748b",
                    marginBottom: 24,
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 12 }}>⏳</div>
                  Generating your question...
                </motion.div>
              ) : currentQA ? (
                <motion.div
                  key="question"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    background: "rgba(13,16,23,0.9)",
                    border: "1px solid rgba(0,212,255,0.15)",
                    borderRadius: 20,
                    padding: 28,
                    marginBottom: 20,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <span
                      style={{
                        fontSize: 11, fontWeight: 600, color: "#8b5cf6",
                        background: "rgba(139,92,246,0.1)", padding: "3px 10px",
                        borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.05em",
                      }}
                    >
                      {selectedVisa} · {CATEGORIES.find((c) => c.value === selectedCategory)?.label}
                    </span>
                  </div>

                  <p style={{ fontSize: 17, fontWeight: 600, color: "#e2e8f0", lineHeight: 1.6, marginBottom: 12 }}>
                    {currentQA.question}
                  </p>

                  {currentQA.context && (
                    <p style={{ fontSize: 12, color: "#64748b", fontStyle: "italic", marginBottom: 20 }}>
                      Officer is assessing: {currentQA.context}
                    </p>
                  )}

                  {!currentQA.evaluated ? (
                    <>
                      <textarea
                        ref={answerRef}
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Type your answer here. Be specific — include dates, numbers, named accomplishments, and explain their significance to the field..."
                        rows={6}
                        style={{
                          width: "100%",
                          background: "rgba(3,5,15,0.8)",
                          border: "1px solid rgba(0,212,255,0.15)",
                          borderRadius: 12,
                          color: "#e2e8f0",
                          fontSize: 14,
                          padding: "14px 16px",
                          resize: "vertical",
                          outline: "none",
                          fontFamily: "inherit",
                          lineHeight: 1.7,
                          boxSizing: "border-box",
                          marginBottom: 16,
                        }}
                      />
                      <div style={{ display: "flex", gap: 10 }}>
                        <button
                          onClick={submitAnswer}
                          disabled={!answer.trim() || loadingEval}
                          style={{
                            flex: 1,
                            padding: "12px 24px",
                            borderRadius: 10,
                            border: "none",
                            background: answer.trim() ? "linear-gradient(135deg, #0066ff, #00d4ff)" : "rgba(255,255,255,0.05)",
                            color: answer.trim() ? "#fff" : "#64748b",
                            fontWeight: 600,
                            fontSize: 14,
                            cursor: answer.trim() ? "pointer" : "not-allowed",
                          }}
                        >
                          {loadingEval ? "Evaluating..." : "Submit Answer →"}
                        </button>
                        <button
                          onClick={fetchQuestion}
                          style={{
                            padding: "12px 20px",
                            borderRadius: 10,
                            border: "1px solid rgba(255,255,255,0.08)",
                            background: "transparent",
                            color: "#64748b",
                            fontWeight: 500,
                            fontSize: 14,
                            cursor: "pointer",
                          }}
                        >
                          Skip
                        </button>
                      </div>
                    </>
                  ) : (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                      <div
                        style={{
                          background: "rgba(3,5,15,0.6)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          borderRadius: 10,
                          padding: "12px 16px",
                          marginBottom: 16,
                          color: "#94a3b8",
                          fontSize: 14,
                          lineHeight: 1.7,
                          fontStyle: "italic",
                        }}
                      >
                        &ldquo;{currentQA.answer}&rdquo;
                      </div>

                      {currentQA.score !== undefined && (
                        <div
                          style={{
                            background: "rgba(13,16,23,0.8)",
                            border: "1px solid rgba(0,212,255,0.1)",
                            borderRadius: 14,
                            padding: "18px 20px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>Attorney Feedback</span>
                            <ScoreBadge score={currentQA.score} />
                          </div>
                          {currentQA.feedback && (
                            <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.7, marginBottom: 10 }}>
                              {currentQA.feedback}
                            </p>
                          )}
                          {currentQA.suggestion && (
                            <div
                              style={{
                                background: "rgba(0,212,255,0.06)",
                                border: "1px solid rgba(0,212,255,0.15)",
                                borderRadius: 8,
                                padding: "10px 14px",
                              }}
                            >
                              <span style={{ color: "#00d4ff", fontSize: 12, fontWeight: 600 }}>Improvement: </span>
                              <span style={{ color: "#94a3b8", fontSize: 13 }}>{currentQA.suggestion}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        onClick={fetchQuestion}
                        style={{
                          marginTop: 16,
                          width: "100%",
                          padding: "12px 24px",
                          borderRadius: 10,
                          border: "1px solid rgba(0,212,255,0.2)",
                          background: "rgba(0,212,255,0.06)",
                          color: "#00d4ff",
                          fontWeight: 600,
                          fontSize: 14,
                          cursor: "pointer",
                        }}
                      >
                        Next Question →
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* History */}
            {history.length > 0 && (
              <div>
                <h3 style={{ fontSize: 14, color: "#64748b", fontWeight: 600, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Session History ({history.length} questions)
                </h3>
                {history.slice(0, 5).map((qa, i) => (
                  <div
                    key={i}
                    style={{
                      background: "rgba(13,16,23,0.6)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      borderRadius: 12,
                      padding: "14px 16px",
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{ color: "#94a3b8", fontSize: 13, flex: 1 }}>{qa.question}</span>
                      {qa.score !== undefined && <ScoreBadge score={qa.score} />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
