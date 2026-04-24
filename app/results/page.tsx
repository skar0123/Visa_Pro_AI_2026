"use client";

import { useEffect, useState, useRef, useCallback } from "react";
// Access control is determined ONLY by the backend response (isPremiumLocked field).
// No client-side token parsing — cookies are sent automatically by the browser.
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { EvaluationResult, RoadmapItem, RFEPrediction, ApprovalSimulation } from "@/lib/ai";
import Navbar from "@/components/Navbar";

interface HybridAnalysis {
  final_score: number;
  confidence_level: "low" | "medium" | "high";
  criteria_met: string[];
  missing_criteria: string[];
  explanation: string;
  improvement_suggestions: string[];
  ml_score: number;
  rules_applied: string[];
  retrieved_sources: { id: string; title: string; cfr_reference?: string }[];
}

interface StoredSection {
  score: number;
  summary?: string;
  highlights?: string[];
}

interface StoredResult {
  applicantName: string;
  overall_score: number;
  visa_probabilities: Record<string, number>;
  sections: {
    education: StoredSection;
    experience: StoredSection;
    skills: StoredSection;
  };
  strengths?: string[];
  gaps?: string[];
  suggestions?: string[];
  roadmap?: RoadmapItem[];
  rfe_predictions?: RFEPrediction[];
  approval_simulation?: ApprovalSimulation;
  hybrid_analysis?: HybridAnalysis;
  isPremiumLocked?: boolean;
}

// ─── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 140 }: { score: number; size?: number }) {
  const [animated, setAnimated] = useState(0);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const timer = setTimeout(() => {
      let start = 0;
      const step = score / 60;
      const interval = setInterval(() => {
        start += step;
        if (start >= score) { setAnimated(score); clearInterval(interval); }
        else { setAnimated(Math.round(start)); }
      }, 16);
      return () => clearInterval(interval);
    }, 400);
    return () => clearTimeout(timer);
  }, [score]);

  const color = score >= 75 ? "#10b981" : score >= 55 ? "#00d4ff" : score >= 35 ? "#f59e0b" : "#ef4444";
  const offset = circumference - (animated / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
      <circle cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        style={{ transformOrigin: "60px 60px", transform: "rotate(-90deg)", transition: "stroke-dashoffset 0.05s linear", filter: `drop-shadow(0 0 10px ${color})` }}
      />
      <text x="60" y="55" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold">{animated}</text>
      <text x="60" y="72" textAnchor="middle" fill="rgba(148,163,184,0.7)" fontSize="9">/ 100</text>
    </svg>
  );
}

// ─── Animated Bar ─────────────────────────────────────────────────────────────
function AnimBar({ value, color, delay = 0 }: { value: number; color: string; delay?: number }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return (
    <div style={{ height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden", flex: 1 }}>
      <div style={{ height: "100%", borderRadius: 3, width: `${w}%`, background: `linear-gradient(90deg, ${color}55, ${color})`, transition: "width 1.2s cubic-bezier(0.22, 1, 0.36, 1)" }} />
    </div>
  );
}

// ─── Typing Text ──────────────────────────────────────────────────────────────
function TypingText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const [started, setStarted] = useState(false);
  const idxRef = useRef(0);

  useEffect(() => { const t = setTimeout(() => setStarted(true), delay); return () => clearTimeout(t); }, [delay]);
  useEffect(() => {
    if (!started) return;
    idxRef.current = 0; setDisplayed(""); setDone(false);
    const iv = setInterval(() => {
      idxRef.current++;
      if (idxRef.current >= text.length) { setDisplayed(text); setDone(true); clearInterval(iv); }
      else { setDisplayed(text.slice(0, idxRef.current)); }
    }, 8);
    return () => clearInterval(iv);
  }, [started, text]);

  return <span>{displayed}{!done && started && <span style={{ color: "#00d4ff", animation: "blink 1s step-end infinite" }}>|</span>}</span>;
}

// ─── Visa Card ────────────────────────────────────────────────────────────────
const VISA_META: Record<string, { label: string; full: string; description: string; color: string; icon: string }> = {
  EB1A:    { label: "EB-1A",    full: "Extraordinary Ability",      description: "Permanent — requires meeting 3 of 10 USCIS criteria at the very top of your field.",          color: "#8b5cf6", icon: "⭐" },
  EB2_NIW: { label: "EB-2 NIW", full: "National Interest Waiver",   description: "Permanent — advanced degree or exceptional ability with national interest benefit.",           color: "#0099ff", icon: "🇺🇸" },
  O1:      { label: "O-1A",     full: "Extraordinary Ability",      description: "Non-immigrant — same criteria as EB-1A, practical threshold slightly more accessible.",       color: "#00d4ff", icon: "✈️" },
  EB5:     { label: "EB-5",     full: "Investor Visa",              description: "Permanent — $800K–$1.05M investment + 10 qualifying jobs. Skills-independent.",               color: "#f59e0b", icon: "💼" },
};

function VisaCard({ visaKey, pct, delay }: { visaKey: string; pct: number; delay: number }) {
  const meta = VISA_META[visaKey];
  const color = meta.color;
  const label = pct >= 70 ? "Strong" : pct >= 50 ? "Moderate" : pct >= 30 ? "Possible" : "Low";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      style={{ borderRadius: 16, border: `1px solid ${color}25`, backgroundColor: "#0d1017", overflow: "hidden", padding: "20px" }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 16 }}>{meta.icon}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#ffffff" }}>{meta.label}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color, background: `${color}18`, border: `1px solid ${color}35`, borderRadius: 999, padding: "2px 7px", letterSpacing: "0.05em" }}>
              {label.toUpperCase()}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>{meta.full}</div>
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>
          {pct}<span style={{ fontSize: 14, fontWeight: 500, color: `${color}80` }}>%</span>
        </div>
      </div>
      <AnimBar value={pct} color={color} delay={delay * 1000 + 500} />
      <p style={{ fontSize: 11.5, color: "#475569", marginTop: 10, lineHeight: 1.55 }}>
        {meta.description}
      </p>
    </motion.div>
  );
}

// ─── RFE Prediction Card ──────────────────────────────────────────────────────
function RFECard({ pred, index }: { pred: RFEPrediction; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const riskColor = pred.risk === "High" ? "#ef4444" : pred.risk === "Medium" ? "#f59e0b" : "#22c55e";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      style={{ borderRadius: 12, border: `1px solid ${riskColor}22`, backgroundColor: "#0d1017", overflow: "hidden", marginBottom: 10 }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        style={{ width: "100%", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, color: riskColor, background: `${riskColor}15`, border: `1px solid ${riskColor}35`, flexShrink: 0, letterSpacing: "0.05em" }}>
          {pred.risk.toUpperCase()} RISK
        </span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{pred.criterion}</span>
        <span style={{ fontSize: 11, color: "#64748b", flexShrink: 0 }}>{pred.cfr_reference}</span>
        <span style={{ color: "#475569", fontSize: 16, flexShrink: 0 }}>{expanded ? "▲" : "▼"}</span>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}>
            <div style={{ padding: "0 16px 16px" }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Likely USCIS Objection</div>
                <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7, margin: 0, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)", borderRadius: 8, padding: "10px 12px" }}>{pred.objection}</p>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#22c55e", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Recommended Mitigation</div>
                <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7, margin: 0, background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.12)", borderRadius: 8, padding: "10px 12px" }}>{pred.mitigation}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Approval Simulation ──────────────────────────────────────────────────────
function ApprovalSimulationPanel({ sim }: { sim: ApprovalSimulation }) {
  const visaColors: Record<string, string> = { EB1A: "#8b5cf6", EB2_NIW: "#0099ff", O1: "#00d4ff", EB5: "#f59e0b" };
  const visaLabels: Record<string, string> = { EB1A: "EB-1A", EB2_NIW: "EB-2 NIW", O1: "O-1A", EB5: "EB-5" };

  return (
    <div>
      <p style={{ fontSize: 12, color: "#64748b", marginBottom: 16, lineHeight: 1.6 }}>
        Projected probability improvement if you implement the recommended actions over the next 12 months.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 20 }}>
        {(["EB1A", "EB2_NIW", "O1", "EB5"] as const).map((visa) => {
          const current = sim.current[visa];
          const projected = sim.projected[visa];
          const delta = projected - current;
          const color = visaColors[visa];
          return (
            <div key={visa} style={{ background: "rgba(13,16,23,0.8)", border: `1px solid ${color}20`, borderRadius: 12, padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{visaLabels[visa]}</span>
                {delta > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#22c55e", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 20, padding: "2px 8px" }}>+{delta}%</span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginBottom: 10 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: `${color}80` }}>{current}%</div>
                  <div style={{ fontSize: 10, color: "#475569" }}>Current</div>
                </div>
                <div style={{ fontSize: 18, color: "#64748b", paddingBottom: 4 }}>→</div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color }}>{projected}%</div>
                  <div style={{ fontSize: 10, color: "#475569" }}>Projected</div>
                </div>
              </div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden", marginBottom: 4 }}>
                <AnimBar value={current} color={`${color}55`} delay={200} />
              </div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
                <AnimBar value={projected} color={color} delay={600} />
              </div>
            </div>
          );
        })}
      </div>
      {sim.improvements.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Actions included in projection</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {sim.improvements.map((imp, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#94a3b8" }}>
                <span style={{ color: "#22c55e", fontSize: 14 }}>✓</span>{imp}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Premium Gate ─────────────────────────────────────────────────────────────
interface PaymentState {
  loading: boolean;
  region: "india" | "international";
  email: string;
  error: string;
}

function PremiumGate({
  score,
  onUnlocked,
}: {
  score: number;
  onUnlocked: () => void;
}) {
  const [pay, setPay] = useState<PaymentState>({
    loading: false,
    region: "international",
    email: "",
    error: "",
  });

  const LOCKED_FEATURES = [
    "Hybrid ML + RAG analysis (Claude AI + knowledge base)",
    "Detailed gap analysis with USCIS regulatory references",
    "12-month strategic roadmap with priority actions",
    "RFE predictor with likely objections & mitigations",
    "Approval probability simulation (+% projections)",
    "Profile strengths — attorney-level analysis",
  ];

  async function handleRazorpay() {
    if (!pay.email) return setPay((p) => ({ ...p, error: "Please enter your email." }));
    setPay((p) => ({ ...p, loading: true, error: "" }));

    try {
      // Create Razorpay order
      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "full_report" }),
      });
      if (!orderRes.ok) throw new Error("Failed to create payment order.");
      const { order_id, amount, currency } = await orderRes.json();

      // Load Razorpay checkout.js dynamically
      await new Promise<void>((resolve, reject) => {
        if ((window as Window & { Razorpay?: unknown }).Razorpay) { resolve(); return; }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Razorpay."));
        document.head.appendChild(script);
      });

      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      await new Promise<void>((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const RazorpayConstructor = (window as unknown as { Razorpay: new (opts: Record<string, unknown>) => { open: () => void } }).Razorpay;
        const rzp = new RazorpayConstructor({
          key: keyId,
          amount,
          currency,
          name: "VisaPro AI",
          description: "Full Analysis Report Unlock",
          order_id,
          prefill: { email: pay.email },
          theme: { color: "#00d4ff" },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              const verifyRes = await fetch("/api/payment/razorpay/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...response, email: pay.email }),
              });
              if (!verifyRes.ok) throw new Error("Payment verification failed.");
              // Server set an HTTP-only cookie in the verify response.
              // Call onUnlocked to re-evaluate with that cookie (sent automatically).
              onUnlocked();
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          modal: {
            ondismiss: () => {
              setPay((p) => ({ ...p, loading: false }));
              resolve();
            },
          },
        });
        rzp.open();
      });
    } catch (err) {
      setPay((p) => ({
        ...p,
        loading: false,
        error: err instanceof Error ? err.message : "Payment failed. Please try again.",
      }));
    }
  }

  async function handleStripe() {
    if (!pay.email) return setPay((p) => ({ ...p, error: "Please enter your email." }));
    setPay((p) => ({ ...p, loading: true, error: "" }));
    try {
      const res = await fetch("/api/payment/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pay.email }),
      });
      if (!res.ok) throw new Error("Failed to create checkout.");
      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      setPay((p) => ({
        ...p,
        loading: false,
        error: err instanceof Error ? err.message : "Payment failed. Please try again.",
      }));
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      style={{
        borderRadius: 20,
        border: "1px solid rgba(139,92,246,0.3)",
        background: "linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(0,212,255,0.04) 100%)",
        padding: "32px",
        marginBottom: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
            🔒
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#ffffff", margin: 0 }}>
              Unlock Your Full AI Report
            </h2>
            <p style={{ fontSize: 13, color: "#64748b", margin: "2px 0 0" }}>
              Your score: <span style={{ color: score >= 75 ? "#10b981" : score >= 55 ? "#00d4ff" : "#f59e0b", fontWeight: 600 }}>{score}/100</span> — get the complete analysis to understand exactly what it means
            </p>
          </div>
        </div>

        {/* Locked features */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8, marginBottom: 28 }}>
          {LOCKED_FEATURES.map((feat, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 10, background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.1)" }}>
              <span style={{ color: "#a78bfa", fontSize: 14, flexShrink: 0 }}>✦</span>
              <span style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{feat}</span>
            </div>
          ))}
        </div>

        {/* Payment form */}
        <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", padding: "24px" }}>
          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 8, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Email Address
            </label>
            <input
              type="email"
              value={pay.email}
              onChange={(e) => setPay((p) => ({ ...p, email: e.target.value, error: "" }))}
              placeholder="you@example.com"
              style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", backgroundColor: "#0d1017", color: "#ffffff", fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {/* Region selector */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 8, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Your Region
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {(["india", "international"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setPay((p) => ({ ...p, region: r }))}
                  style={{
                    flex: 1, padding: "10px", borderRadius: 8, cursor: "pointer",
                    border: `1px solid ${pay.region === r ? "rgba(0,212,255,0.4)" : "rgba(255,255,255,0.1)"}`,
                    background: pay.region === r ? "rgba(0,212,255,0.08)" : "transparent",
                    color: pay.region === r ? "#00d4ff" : "#64748b",
                    fontSize: 13, fontWeight: 600,
                  }}
                >
                  {r === "india" ? "🇮🇳 India" : "🌍 International"}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {pay.error && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5", fontSize: 13, marginBottom: 16 }}>
              {pay.error}
            </div>
          )}

          {/* Pay button */}
          {pay.region === "india" ? (
            <button
              onClick={handleRazorpay}
              disabled={pay.loading}
              style={{ width: "100%", padding: "14px 20px", borderRadius: 10, border: "none", background: pay.loading ? "rgba(0,102,255,0.4)" : "linear-gradient(135deg, #0055ee, #0099ff)", color: "#ffffff", fontSize: 15, fontWeight: 700, cursor: pay.loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
            >
              {pay.loading ? (
                <><Spinner />Processing...</>
              ) : (
                <>Pay ₹3,000 with Razorpay</>
              )}
            </button>
          ) : (
            <button
              onClick={handleStripe}
              disabled={pay.loading}
              style={{ width: "100%", padding: "14px 20px", borderRadius: 10, border: "none", background: pay.loading ? "rgba(99,102,241,0.4)" : "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "#ffffff", fontSize: 15, fontWeight: 700, cursor: pay.loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
            >
              {pay.loading ? (
                <><Spinner />Processing...</>
              ) : (
                <>Pay $150 with Stripe</>
              )}
            </button>
          )}

          <p style={{ textAlign: "center", fontSize: 11, color: "#334155", marginTop: 10 }}>
            {pay.region === "india"
              ? "Secured by Razorpay · All major UPI, cards & net banking accepted"
              : "Secured by Stripe · All major credit & debit cards accepted"}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function Spinner() {
  return (
    <svg style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} fill="none" viewBox="0 0 24 24">
      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
      <path style={{ opacity: 0.9 }} fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<StoredResult | null>(null);
  const [activeTab, setActiveTab] = useState<"gaps" | "suggestions" | "rfe" | "simulation">("gaps");
  const [mounted, setMounted] = useState(false);

  // Read result from sessionStorage after mount
  useEffect(() => {
    setMounted(true);
    const raw = sessionStorage.getItem("visapro_result");
    if (!raw) { router.replace("/dashboard"); return; }
    try { setResult(JSON.parse(raw)); }
    catch { router.replace("/dashboard"); }
  }, [router]);

  // Called when Razorpay payment completes on this page.
  // The verify endpoint already set an HTTP-only cookie — just re-evaluate;
  // the browser will send that cookie automatically.
  const handleUnlocked = useCallback(async () => {
    const inputs = (() => {
      try { return JSON.parse(localStorage.getItem("visapro_profile_inputs") || "null"); }
      catch { return null; }
    })();

    if (!inputs) {
      // No cached inputs — reload so the backend cookie is picked up on next evaluation
      window.location.reload();
      return;
    }

    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Cookie sent automatically — no Authorization header needed
        body: JSON.stringify(inputs),
      });
      if (res.ok) {
        const fullResult = await res.json();
        const stored = { ...fullResult, applicantName: inputs.name || "Applicant" };
        sessionStorage.setItem("visapro_result", JSON.stringify(stored));
        setResult(stored);
      }
    } catch { /* re-evaluate silently failed; reload as fallback */ }
  }, []);

  if (!mounted || !result) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#08090f", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <svg style={{ width: 40, height: 40, animation: "spin 1s linear infinite" }} fill="none" viewBox="0 0 24 24">
            <circle style={{ opacity: 0.2 }} cx="12" cy="12" r="10" stroke="#00d4ff" strokeWidth="4" />
            <path style={{ opacity: 0.9 }} fill="#00d4ff" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p style={{ color: "#475569", fontSize: 14 }}>Loading analysis...</p>
        </div>
      </div>
    );
  }

  // Access is determined entirely by what the backend returned.
  // isPremiumLocked=true means the API stripped premium data for this user.
  const isLocked = result.isPremiumLocked === true;

  const {
    overall_score, sections, visa_probabilities, strengths, gaps, suggestions,
    applicantName, rfe_predictions, approval_simulation, hybrid_analysis,
  } = result;

  const displayScore = hybrid_analysis?.final_score ?? overall_score;
  const displaySuggestions = hybrid_analysis?.improvement_suggestions?.length
    ? hybrid_analysis.improvement_suggestions
    : (suggestions ?? []);
  const confidenceLevel = hybrid_analysis?.confidence_level;

  const scoreColor = displayScore >= 75 ? "#10b981" : displayScore >= 55 ? "#00d4ff" : displayScore >= 35 ? "#f59e0b" : "#ef4444";
  const scoreLabel = displayScore >= 75 ? "Strong Candidate" : displayScore >= 55 ? "Moderate Candidate" : displayScore >= 35 ? "Developing Profile" : "Needs Significant Work";

  const card: React.CSSProperties = { borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "#0d1017", padding: "24px" };
  const sectionColor = (s: number) => s >= 75 ? "#10b981" : s >= 55 ? "#00d4ff" : s >= 35 ? "#f59e0b" : "#ef4444";

  const tabs: { key: "gaps" | "suggestions" | "rfe" | "simulation"; label: string }[] = [
    { key: "gaps", label: "⚠️  Gap Analysis" },
    { key: "suggestions", label: "💡  Roadmap" },
    ...(rfe_predictions && rfe_predictions.length > 0 ? [{ key: "rfe" as const, label: "🚨  RFE Predictor" }] : []),
    ...(approval_simulation ? [{ key: "simulation" as const, label: "📈  Approval Simulation" }] : []),
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#08090f", color: "#ffffff" }}>
      <Navbar />

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "88px 24px 80px" }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#00d4ff", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>Analysis Complete</p>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#ffffff", margin: "0 0 16px" }}>
            {applicantName !== "Applicant" ? `${applicantName}'s ` : ""}Visa Readiness Report
          </h1>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/strategy" style={{ fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 8, textDecoration: "none", color: "#00d4ff", background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)" }}>
              🗺️ View Strategy Roadmap
            </Link>
            <Link href="/interview" style={{ fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 8, textDecoration: "none", color: "#a78bfa", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
              🎤 Practice Interview
            </Link>
            <Link href="/history" style={{ fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 8, textDecoration: "none", color: "#64748b", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              📊 View History
            </Link>
          </div>
        </motion.div>

        {/* ── Overall Score Hero ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.05 }}
          style={{ ...card, border: `1px solid ${scoreColor}22`, marginBottom: 20, position: "relative", overflow: "hidden" }}
        >
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 0%, ${scoreColor}0d 0%, transparent 65%)`, pointerEvents: "none" }} />
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 32, flexWrap: "wrap", position: "relative", zIndex: 1 }}>
            <ScoreRing score={displayScore} size={140} />
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ fontSize: 11, color: "rgba(148,163,184,0.6)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Overall Visa Readiness</div>
                {hybrid_analysis && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#a78bfa", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)", borderRadius: 4, padding: "2px 6px", letterSpacing: "0.06em", textTransform: "uppercase" }}>ML + RAG</span>
                )}
              </div>
              <div style={{ fontSize: 42, fontWeight: 800, color: "#ffffff", lineHeight: 1, marginBottom: 4 }}>
                {displayScore}<span style={{ fontSize: 20, color: "#475569", fontWeight: 400 }}>/100</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: scoreColor }}>{scoreLabel}</div>
                {confidenceLevel && (
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: confidenceLevel === "high" ? "#10b981" : confidenceLevel === "medium" ? "#f59e0b" : "#ef4444",
                    background: confidenceLevel === "high" ? "rgba(16,185,129,0.1)" : confidenceLevel === "medium" ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)",
                    border: `1px solid ${confidenceLevel === "high" ? "rgba(16,185,129,0.25)" : confidenceLevel === "medium" ? "rgba(245,158,11,0.25)" : "rgba(239,68,68,0.25)"}`,
                    borderRadius: 4, padding: "2px 7px", textTransform: "uppercase", letterSpacing: "0.06em",
                  }}>
                    {confidenceLevel} confidence
                  </span>
                )}
              </div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 14px", borderRadius: 999, background: `${scoreColor}14`, border: `1px solid ${scoreColor}35`, fontSize: 12, color: scoreColor, fontWeight: 500 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: scoreColor, display: "inline-block" }} />
                {displayScore >= 75 ? "Recommended to proceed with filing" : displayScore >= 55 ? "Address identified gaps before filing" : "Significant profile development needed"}
              </div>
            </div>
            {/* Section mini-scores */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 180 }}>
              {sections && [
                { label: "Education",   score: sections.education?.score ?? 0,   icon: "🎓" },
                { label: "Experience",  score: sections.experience?.score ?? 0,  icon: "💼" },
                { label: "Skills",      score: sections.skills?.score ?? 0,      icon: "⚡" },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 14, width: 20 }}>{s.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>{s.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: sectionColor(s.score) }}>{s.score}</span>
                    </div>
                    <AnimBar value={s.score} color={sectionColor(s.score)} delay={400 + i * 100} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Visa Probability Cards ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#ffffff", margin: 0 }}>Visa Classification Probability</h2>
            <span style={{ fontSize: 11, color: "#64748b", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "2px 8px" }}>AI Scored</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {visa_probabilities && Object.entries(visa_probabilities).map(([key, pct], i) => (
              <VisaCard key={key} visaKey={key} pct={pct as number} delay={0.12 + i * 0.06} />
            ))}
          </div>
        </motion.div>

        {/* ── Premium Gate (free users) ── */}
        {isLocked && (
          <PremiumGate score={displayScore} onUnlocked={handleUnlocked} />
        )}

        {/* ── Premium Content (paid users) ── */}
        {!isLocked && (
          <>
            {/* Section Detail Cards */}
            {sections && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.18 }}
                style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12, marginBottom: 20 }}
              >
                {[
                  { label: "Education",  icon: "🎓", data: sections.education },
                  { label: "Experience", icon: "💼", data: sections.experience },
                  { label: "Skills",     icon: "⚡", data: sections.skills },
                ].map((s, i) => {
                  if (!s.data) return null;
                  const c = sectionColor(s.data.score);
                  return (
                    <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.22 + i * 0.07 }}
                      style={{ ...card, border: `1px solid ${c}18` }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 18 }}>{s.icon}</span>
                          <span style={{ fontSize: 14, fontWeight: 600, color: "#ffffff" }}>{s.label}</span>
                        </div>
                        <span style={{ fontSize: 24, fontWeight: 800, color: c }}>{s.data.score}</span>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <AnimBar value={s.data.score} color={c} delay={500 + i * 80} />
                      </div>
                      {s.data.summary && (
                        <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.55, marginBottom: s.data.highlights?.length ? 10 : 0 }}>
                          {s.data.summary}
                        </p>
                      )}
                      {s.data.highlights?.map((h, j) => (
                        <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: 5, fontSize: 11.5, color: "#475569" }}>
                          <span style={{ color: c, flexShrink: 0, marginTop: 1 }}>✓</span>
                          <span>{h}</span>
                        </div>
                      ))}
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* Strengths */}
            {strengths && strengths.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.26 }}
                style={{ ...card, border: "1px solid rgba(16,185,129,0.2)", marginBottom: 20 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✅</div>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: "#ffffff", margin: 0 }}>Profile Strengths</h2>
                  <span style={{ fontSize: 11, color: "#10b981", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 6, padding: "2px 8px" }}>Attorney Analysis</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {strengths.map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, delay: 0.28 + i * 0.06 }}
                      style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", borderRadius: 10, background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.1)" }}
                    >
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.35)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, fontSize: 10, color: "#10b981", fontWeight: 700 }}>
                        {i + 1}
                      </div>
                      <p style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.6, margin: 0 }}>{s}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Analysis Tabs */}
            {(gaps || displaySuggestions.length > 0 || rfe_predictions || approval_simulation) && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.32 }}
                style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "#0d1017", overflow: "hidden", marginBottom: 24 }}
              >
                <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.08)", overflowX: "auto" }}>
                  {tabs.map((tab) => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                      style={{ flexShrink: 0, padding: "14px 18px", fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", borderBottom: `2px solid ${activeTab === tab.key ? "#00d4ff" : "transparent"}`, background: activeTab === tab.key ? "rgba(0,212,255,0.05)" : "transparent", color: activeTab === tab.key ? "#00d4ff" : "rgba(148,163,184,0.55)", transition: "all 0.2s", whiteSpace: "nowrap" }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div style={{ padding: 24 }}>
                  <AnimatePresence mode="wait">
                    {activeTab === "gaps" && (
                      <motion.div key="gaps" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                        <p style={{ fontSize: 12, color: "#475569", marginBottom: 16, lineHeight: 1.6 }}>
                          Critical gaps identified against USCIS O-1A, EB-1A, and EB-2 NIW adjudication criteria.
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {(gaps ?? []).map((gap, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: i * 0.07 }}
                              style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", borderRadius: 10, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.14)" }}
                            >
                              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(239,68,68,0.18)", border: "1px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2, fontSize: 10, color: "#fca5a5", fontWeight: 700 }}>
                                {i + 1}
                              </div>
                              <p style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.65, margin: 0 }}>{gap}</p>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "suggestions" && (
                      <motion.div key="suggestions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                        <p style={{ fontSize: 12, color: "#475569", marginBottom: 16, lineHeight: 1.6 }}>
                          Detailed, priority-ordered actions to strengthen your petition.
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          {displaySuggestions.map((s, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: i * 0.08 }}
                              style={{ padding: "16px 18px", borderRadius: 10, background: "rgba(0,212,255,0.03)", border: "1px solid rgba(0,212,255,0.1)" }}
                            >
                              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                                <div style={{ width: 24, height: 24, borderRadius: 7, background: "rgba(0,212,255,0.14)", border: "1px solid rgba(0,212,255,0.28)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, fontSize: 10, color: "#00d4ff", fontWeight: 700 }}>
                                  {i + 1}
                                </div>
                                <p style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.7, margin: 0 }}>
                                  <TypingText text={s} delay={100 + i * 250} />
                                </p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "rfe" && rfe_predictions && (
                      <motion.div key="rfe" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                        <p style={{ fontSize: 12, color: "#475569", marginBottom: 16, lineHeight: 1.6 }}>
                          Predicted USCIS Requests for Evidence (RFEs) based on gaps in the current record.
                        </p>
                        {rfe_predictions.map((pred, i) => (
                          <RFECard key={i} pred={pred} index={i} />
                        ))}
                      </motion.div>
                    )}

                    {activeTab === "simulation" && approval_simulation && (
                      <motion.div key="simulation" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                        <ApprovalSimulationPanel sim={approval_simulation} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* Action buttons */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}
              style={{ display: "flex", gap: 12, flexWrap: "wrap", paddingBottom: 20 }}
            >
              <Link href="/dashboard" style={{ flex: 1, minWidth: 140, textDecoration: "none" }}>
                <button style={{ width: "100%", padding: "14px 20px", borderRadius: 10, border: "1px solid rgba(0,212,255,0.25)", color: "#00d4ff", background: "rgba(0,212,255,0.06)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  ← New Analysis
                </button>
              </Link>
              <Link href="/strategy" style={{ flex: 1, minWidth: 140, textDecoration: "none" }}>
                <button style={{ width: "100%", padding: "14px 20px", borderRadius: 10, border: "1px solid rgba(0,212,255,0.25)", color: "#e2e8f0", background: "rgba(13,16,23,0.8)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  🗺️ Strategy Roadmap
                </button>
              </Link>
              <button onClick={() => window.print()}
                style={{ flex: 1, minWidth: 140, padding: "14px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #0055ee, #00d4ff)", color: "#ffffff", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 20px rgba(0,153,255,0.3)" }}
              >
                Export Report ↗
              </button>
            </motion.div>
          </>
        )}

        {/* CTA for locked users — return link */}
        {isLocked && (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", paddingBottom: 20 }}>
            <Link href="/dashboard" style={{ flex: 1, minWidth: 140, textDecoration: "none" }}>
              <button style={{ width: "100%", padding: "14px 20px", borderRadius: 10, border: "1px solid rgba(0,212,255,0.25)", color: "#00d4ff", background: "rgba(0,212,255,0.06)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                ← New Analysis
              </button>
            </Link>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}
