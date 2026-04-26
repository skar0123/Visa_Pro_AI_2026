"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { initiatePayment } from "@/lib/razorpay";
import PayPalButton from "@/components/PayPalButton";
import type { PayPalPlan } from "@/lib/paypal";

// ── Types ─────────────────────────────────────────────────────────────────────
interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: "free" | "pro" | "premium";
  name: string;
  price: number;
  currency: string;
  period: string;
  description: string;
  features: PlanFeature[];
  cta: string;
  popular: boolean;
  accentColor: string;
  glowColor: string;
}

// ── India plans (Razorpay / INR) ──────────────────────────────────────────────
const INDIA_PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    currency: "₹",
    period: "forever",
    description: "Get started with basic AI visa evaluation at no cost.",
    accentColor: "rgba(100,116,139,0.8)",
    glowColor: "rgba(100,116,139,0.12)",
    popular: false,
    cta: "Start Free",
    features: [
      { text: "Basic visa profile evaluation", included: true },
      { text: "Overall readiness score", included: true },
      { text: "Limited section insights", included: true },
      { text: "3 evaluations included", included: true },
      { text: "USCIS-style gap analysis", included: false },
      { text: "Visa probability scoring", included: false },
      { text: "12-month improvement roadmap", included: false },
      { text: "RFE risk detection", included: false },
      { text: "Downloadable PDF report", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 4999,
    currency: "₹",
    period: "per month",
    description: "Full AI-powered analysis built for serious visa applicants.",
    accentColor: "#00d4ff",
    glowColor: "rgba(0,212,255,0.15)",
    popular: true,
    cta: "Upgrade to Pro",
    features: [
      { text: "Full AI visa evaluation", included: true },
      { text: "Overall readiness score", included: true },
      { text: "USCIS-style gap analysis", included: true },
      { text: "Visa probability scoring (EB-1A, NIW, O-1A)", included: true },
      { text: "12-month improvement roadmap", included: true },
      { text: "RFE risk detection", included: true },
      { text: "Approval simulation", included: true },
      { text: "Interview prep insights", included: false },
      { text: "Downloadable PDF report", included: false },
    ],
  },
  {
    id: "premium",
    name: "Prime",
    price: 9999,
    currency: "₹",
    period: "per month",
    description: "The complete toolkit for professionals pursuing extraordinary ability visas.",
    accentColor: "#a78bfa",
    glowColor: "rgba(139,92,246,0.15)",
    popular: false,
    cta: "Get Prime",
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Advanced 12-month strategy plan", included: true },
      { text: "Priority AI analysis", included: true },
      { text: "Downloadable PDF report", included: true },
      { text: "Interview preparation insights", included: true },
      { text: "Attorney-grade petition checklist", included: true },
      { text: "Unlimited evaluations", included: true },
      { text: "Early access to new features", included: true },
      { text: "Dedicated support", included: true },
    ],
  },
];

// ── International plans (PayPal / USD) ────────────────────────────────────────
const INTL_PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    currency: "$",
    period: "forever",
    description: "Get started with basic AI visa evaluation at no cost.",
    accentColor: "rgba(100,116,139,0.8)",
    glowColor: "rgba(100,116,139,0.12)",
    popular: false,
    cta: "Start Free",
    features: [
      { text: "Basic visa profile evaluation", included: true },
      { text: "Overall readiness score", included: true },
      { text: "Limited section insights", included: true },
      { text: "3 evaluations included", included: true },
      { text: "USCIS-style gap analysis", included: false },
      { text: "Visa probability scoring", included: false },
      { text: "12-month improvement roadmap", included: false },
      { text: "RFE risk detection", included: false },
      { text: "Downloadable PDF report", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 99,
    currency: "$",
    period: "per month",
    description: "Full AI-powered analysis built for serious visa applicants.",
    accentColor: "#00d4ff",
    glowColor: "rgba(0,212,255,0.15)",
    popular: true,
    cta: "Upgrade to Pro",
    features: [
      { text: "Full AI visa evaluation", included: true },
      { text: "Overall readiness score", included: true },
      { text: "USCIS-style gap analysis", included: true },
      { text: "Visa probability scoring (EB-1A, NIW, O-1A)", included: true },
      { text: "12-month improvement roadmap", included: true },
      { text: "RFE risk detection", included: true },
      { text: "Approval simulation", included: true },
      { text: "Interview prep insights", included: false },
      { text: "Downloadable PDF report", included: false },
    ],
  },
  {
    id: "premium",
    name: "Prime",
    price: 199,
    currency: "$",
    period: "per month",
    description: "The complete toolkit for professionals pursuing extraordinary ability visas.",
    accentColor: "#a78bfa",
    glowColor: "rgba(139,92,246,0.15)",
    popular: false,
    cta: "Get Prime",
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Advanced 12-month strategy plan", included: true },
      { text: "Priority AI analysis", included: true },
      { text: "Downloadable PDF report", included: true },
      { text: "Interview preparation insights", included: true },
      { text: "Attorney-grade petition checklist", included: true },
      { text: "Unlimited evaluations", included: true },
      { text: "Early access to new features", included: true },
      { text: "Dedicated support", included: true },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function CheckIcon({ color }: { color: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
      <circle cx="8" cy="8" r="7.5" fill={color} fillOpacity="0.15" stroke={color} strokeOpacity="0.4" strokeWidth="1" />
      <path d="M5 8l2 2 4-4" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
      <circle cx="8" cy="8" r="7.5" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="rgba(100,116,139,0.4)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function Toast({ message, type }: { message: string; type: "error" | "info" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      style={{
        position: "fixed",
        bottom: 28,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        padding: "12px 22px",
        borderRadius: 12,
        background: type === "error" ? "rgba(239,68,68,0.12)" : "rgba(0,212,255,0.1)",
        border: `1px solid ${type === "error" ? "rgba(239,68,68,0.3)" : "rgba(0,212,255,0.3)"}`,
        backdropFilter: "blur(16px)",
        color: type === "error" ? "#fca5a5" : "#00d4ff",
        fontSize: 13,
        fontWeight: 500,
        whiteSpace: "nowrap",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      {message}
    </motion.div>
  );
}

// ── Pricing card ──────────────────────────────────────────────────────────────
function PricingCard({
  plan,
  index,
  onSelect,
}: {
  plan: Plan;
  index: number;
  onSelect: (plan: Plan) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.12 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        borderRadius: 24,
        padding: plan.popular ? "32px 28px 28px" : "28px 28px 28px",
        display: "flex",
        flexDirection: "column",
        background: plan.popular ? "rgba(0,212,255,0.04)" : "rgba(10,12,20,0.7)",
        border: plan.popular
          ? `1px solid rgba(0,212,255,${hovered ? "0.5" : "0.28"})`
          : `1px solid rgba(255,255,255,${hovered ? "0.12" : "0.07"})`,
        backdropFilter: "blur(12px)",
        transform: hovered ? "translateY(-8px) scale(1.01)" : plan.popular ? "translateY(-4px)" : "translateY(0)",
        transition: "transform 0.28s ease, border-color 0.28s ease, box-shadow 0.28s ease",
        boxShadow: hovered
          ? `0 24px 64px rgba(0,0,0,0.45), 0 0 0 1px ${plan.accentColor}30, 0 0 60px ${plan.glowColor}`
          : plan.popular
          ? "0 16px 48px rgba(0,0,0,0.3), 0 0 40px rgba(0,212,255,0.08)"
          : "0 4px 24px rgba(0,0,0,0.2)",
      }}
    >
      {plan.popular && (
        <div
          style={{
            position: "absolute",
            top: -14,
            left: "50%",
            transform: "translateX(-50%)",
            background: "linear-gradient(135deg, #0066ff, #00d4ff)",
            color: "#fff",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "5px 16px",
            borderRadius: 999,
            whiteSpace: "nowrap",
            boxShadow: "0 4px 20px rgba(0,153,255,0.4)",
          }}
        >
          ⭐ Most Popular
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: plan.accentColor, marginBottom: 8, opacity: 0.9 }}>
          {plan.name}
        </div>
        <p style={{ fontSize: 13, color: "rgba(100,116,139,0.75)", lineHeight: 1.6, margin: 0 }}>
          {plan.description}
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 28 }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: "rgba(148,163,184,0.7)", marginBottom: 6 }}>
          {plan.currency}
        </span>
        <span
          style={{
            fontSize: 52,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            color: "#fff",
            background: plan.popular ? "linear-gradient(135deg, #fff 40%, rgba(0,212,255,0.9) 100%)" : undefined,
            WebkitBackgroundClip: plan.popular ? "text" : undefined,
            WebkitTextFillColor: plan.popular ? "transparent" : undefined,
            backgroundClip: plan.popular ? "text" : undefined,
          }}
        >
          {plan.price}
        </span>
        <span style={{ fontSize: 13, color: "rgba(100,116,139,0.6)", marginBottom: 10, lineHeight: 1.3 }}>
          /{plan.period}
        </span>
      </div>

      <div style={{ height: 1, background: `linear-gradient(90deg, ${plan.accentColor}25, transparent)`, marginBottom: 24 }} />

      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "flex", flexDirection: "column", gap: 11, flex: 1 }}>
        {plan.features.map((f) => (
          <li
            key={f.text}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              fontSize: 13.5,
              color: f.included ? "rgba(203,213,225,0.85)" : "rgba(100,116,139,0.45)",
            }}
          >
            {f.included ? <CheckIcon color={plan.accentColor} /> : <CrossIcon />}
            <span style={{ textDecoration: f.included ? "none" : "line-through", textDecorationColor: "rgba(100,116,139,0.25)" }}>
              {f.text}
            </span>
          </li>
        ))}
      </ul>

      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => onSelect(plan)}
        style={{
          width: "100%",
          padding: "13px 20px",
          borderRadius: 12,
          border: plan.id === "free" ? `1px solid ${plan.accentColor}35` : "none",
          background: plan.id === "free"
            ? `${plan.accentColor}0d`
            : plan.popular
            ? "linear-gradient(135deg, #0055ee 0%, #00d4ff 100%)"
            : `linear-gradient(135deg, ${plan.accentColor}cc, ${plan.accentColor})`,
          color: plan.id === "free" ? plan.accentColor : "#fff",
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: plan.popular ? "0 4px 24px rgba(0,153,255,0.35)" : "none",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {plan.popular && plan.id !== "free" && (
          <span style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)", animation: "shimmer 2.5s infinite" }} />
        )}
        <span style={{ position: "relative" }}>{plan.cta} →</span>
      </motion.button>

      <style>{`
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
      `}</style>
    </motion.div>
  );
}

// ── Tab toggle ────────────────────────────────────────────────────────────────
function TabToggle({ tab, onChange }: { tab: "india" | "international"; onChange: (t: "india" | "international") => void }) {
  return (
    <div
      style={{
        display: "inline-flex",
        borderRadius: 999,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        padding: 4,
        gap: 4,
        marginBottom: 56,
      }}
    >
      {(["india", "international"] as const).map((t) => {
        const active = tab === t;
        return (
          <motion.button
            key={t}
            onClick={() => onChange(t)}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: "9px 22px",
              borderRadius: 999,
              border: "none",
              background: active ? "linear-gradient(135deg, #0055ee, #00d4ff)" : "transparent",
              color: active ? "#fff" : "rgba(100,116,139,0.75)",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: active ? "0 4px 16px rgba(0,153,255,0.3)" : "none",
              transition: "background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease",
              whiteSpace: "nowrap",
            }}
          >
            {t === "india" ? "🇮🇳 India" : "🌍 International"}
          </motion.button>
        );
      })}
    </div>
  );
}

// ── Email Capture Modal ───────────────────────────────────────────────────────
interface ModalState {
  plan: Plan | null;
  tab: "india" | "international";
  step: 1 | 2; // 1 = email, 2 = paypal buttons
  email: string;
  loading: boolean;
  error: string;
}

const MODAL_CLOSED: ModalState = {
  plan: null,
  tab: "india",
  step: 1,
  email: "",
  loading: false,
  error: "",
};

function EmailModal({
  modal,
  onClose,
  onEmailChange,
  onContinue,
  onPayPalSuccess,
  onPayPalError,
}: {
  modal: ModalState;
  onClose: () => void;
  onEmailChange: (email: string) => void;
  onContinue: () => void;
  onPayPalSuccess: (orderId: string) => void;
  onPayPalError: (msg: string) => void;
}) {
  const { plan, tab, step, email, loading, error } = modal;
  if (!plan) return null;

  const isPaid = plan.id !== "free";
  const isInternationalPaid = isPaid && tab === "international";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "rgba(3,5,15,0.85)",
        backdropFilter: "blur(12px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.22 }}
        style={{
          width: "100%",
          maxWidth: 440,
          borderRadius: 20,
          background: "#0d1017",
          border: `1px solid ${plan.accentColor}35`,
          padding: 32,
          boxShadow: `0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px ${plan.accentColor}15`,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: plan.accentColor, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
              {plan.name} Plan
            </p>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>
              {plan.id === "free" ? "Start for Free" : `Get ${plan.name}`}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#64748b", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ✕
          </button>
        </div>

        {step === 1 && (
          <>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Your Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !loading) onContinue(); }}
                placeholder="you@example.com"
                autoFocus
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: `1px solid ${error ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.12)"}`,
                  background: "#070a10",
                  color: "#fff",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <p style={{ fontSize: 11, color: "#334155", marginTop: 6 }}>
                {plan.id === "free"
                  ? "Your email identifies your account and tracks your 3 free evaluations."
                  : "Your email is used to create and manage your subscription account."}
              </p>
            </div>

            {error && (
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5", fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button
              onClick={onContinue}
              disabled={loading}
              style={{
                width: "100%",
                padding: "13px 20px",
                borderRadius: 10,
                border: "none",
                background: loading
                  ? "rgba(0,102,255,0.4)"
                  : plan.id === "free"
                  ? `linear-gradient(135deg, rgba(100,116,139,0.5), rgba(100,116,139,0.7))`
                  : plan.popular
                  ? "linear-gradient(135deg, #0055ee, #00d4ff)"
                  : `linear-gradient(135deg, ${plan.accentColor}cc, ${plan.accentColor})`,
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {loading ? (
                <>
                  <svg style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                    <path style={{ opacity: 0.85 }} fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {plan.id === "free" ? "Setting up your account..." : "Opening payment..."}
                </>
              ) : (
                <>
                  {plan.id === "free"
                    ? "Continue for Free →"
                    : isInternationalPaid
                    ? "Continue to PayPal →"
                    : `Pay ${plan.currency}${plan.price} with Razorpay →`}
                </>
              )}
            </button>
          </>
        )}

        {step === 2 && isInternationalPaid && (
          <>
            <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20, lineHeight: 1.6 }}>
              Complete your payment below. Your account will be activated immediately after payment.
            </p>
            <PayPalButton
              plan={plan.id as PayPalPlan}
              onSuccess={onPayPalSuccess}
              onError={onPayPalError}
            />
            <button
              onClick={onClose}
              style={{ width: "100%", marginTop: 12, padding: "10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#64748b", fontSize: 13, cursor: "pointer" }}
            >
              Cancel
            </button>
          </>
        )}

        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </motion.div>
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────
export default function Pricing() {
  const router = useRouter();
  const [tab, setTab] = useState<"india" | "international">("international");
  const [modal, setModal] = useState<ModalState>(MODAL_CLOSED);
  const [paying, setPaying] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "error" | "info" } | null>(null);

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz.includes("Calcutta") || tz.includes("Kolkata")) {
      setTab("india");
    }
  }, []);

  function showToast(message: string, type: "error" | "info", duration = 4000) {
    setToast({ message, type });
    setTimeout(() => setToast(null), duration);
  }

  function handlePlanSelect(plan: Plan) {
    setModal({ plan, tab, step: 1, email: "", loading: false, error: "" });
  }

  async function handleModalContinue() {
    const { plan, tab: currentTab, email } = modal;
    if (!plan) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmedEmail)) {
      setModal((m) => ({ ...m, error: "Please enter a valid email address." }));
      return;
    }

    setModal((m) => ({ ...m, loading: true, error: "" }));

    // ── Free plan: init session → dashboard ──────────────────────────────────
    if (plan.id === "free") {
      try {
        const res = await fetch("/api/auth/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmedEmail }),
        });
        if (res.ok) {
          setModal(MODAL_CLOSED);
          router.push("/dashboard");
        } else {
          const data = await res.json();
          setModal((m) => ({ ...m, loading: false, error: data.error || "Setup failed. Please try again." }));
        }
      } catch {
        setModal((m) => ({ ...m, loading: false, error: "Network error. Please try again." }));
      }
      return;
    }

    // ── India paid plan: open Razorpay ───────────────────────────────────────
    if (currentTab === "india") {
      setModal((m) => ({ ...m, loading: false }));
      setPaying(true);

      await initiatePayment({
        plan: plan.id as "pro" | "premium",
        email: trimmedEmail,
        onSuccess() {
          setPaying(false);
          setModal(MODAL_CLOSED);
          showToast("Payment successful! Redirecting…", "info", 2500);
          setTimeout(() => router.push("/dashboard"), 1000);
        },
        onError(message) {
          setPaying(false);
          setModal((m) => ({ ...m, loading: false, error: message }));
        },
        onDismiss() {
          setPaying(false);
          setModal((m) => ({ ...m, loading: false }));
        },
      });
      return;
    }

    // ── International paid plan: show PayPal buttons ─────────────────────────
    setModal((m) => ({ ...m, loading: false, step: 2 }));
  }

  async function handlePayPalSuccess(orderId: string) {
    const email = modal.email.trim();
    const planId = modal.plan?.id ?? "pro";
    try {
      const res = await fetch("/api/auth/upgrade-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          provider: "paypal",
          orderId,
          amount: planId === "premium" ? 19900 : 9900,
          currency: "USD",
        }),
      });
      if (res.ok) {
        setModal(MODAL_CLOSED);
        showToast("Payment successful! Redirecting…", "info", 2500);
        setTimeout(() => router.push("/dashboard"), 1000);
      } else {
        setModal((m) => ({ ...m, error: "Session activation failed. Please contact support." }));
      }
    } catch {
      setModal((m) => ({ ...m, error: "Network error. Please contact support." }));
    }
  }

  function handlePayPalError(msg: string) {
    setModal((m) => ({ ...m, error: msg }));
    showToast(msg, "error");
  }

  const plans = tab === "india" ? INDIA_PLANS : INTL_PLANS;

  return (
    <section id="pricing" style={{ padding: "120px 24px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", width: 900, height: 600, background: "radial-gradient(ellipse, rgba(0,102,255,0.06) 0%, transparent 65%)" }} />
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: 40 }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 999, background: "rgba(0,212,255,0.07)", border: "1px solid rgba(0,212,255,0.18)", color: "#00d4ff", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 20 }}>
            Pricing
          </div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", marginBottom: 16, lineHeight: 1.15 }}>
            Simple,{" "}
            <span style={{ background: "linear-gradient(135deg, #0099ff, #00d4ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Transparent
            </span>{" "}
            Pricing
          </h2>
          <p style={{ fontSize: 16, color: "rgba(100,116,139,0.75)", maxWidth: 460, margin: "0 auto", lineHeight: 1.65 }}>
            Start free. Upgrade when you need the full power of AI-driven immigration analysis.
          </p>
        </motion.div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <TabToggle tab={tab} onChange={(t) => setTab(t)} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28 }}
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, alignItems: "start" }}
          >
            {plans.map((plan, i) => (
              <PricingCard
                key={`${tab}-${plan.id}`}
                plan={plan}
                index={i}
                onSelect={handlePlanSelect}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          style={{ textAlign: "center", marginTop: 40, fontSize: 13, color: "rgba(100,116,139,0.5)" }}
        >
          {tab === "india"
            ? "Secure payments via Razorpay (India). "
            : "Secure payments via PayPal (International). "}
          All plans include in-session processing.{" "}
          <a href="mailto:contact@neuralopsai.in" style={{ color: "rgba(0,212,255,0.6)", textDecoration: "none" }}>
            Contact us
          </a>{" "}
          for enterprise pricing.
        </motion.p>
      </div>

      {/* Email capture modal */}
      <AnimatePresence>
        {modal.plan && (
          <EmailModal
            key="email-modal"
            modal={modal}
            onClose={() => { if (!paying) setModal(MODAL_CLOSED); }}
            onEmailChange={(email) => setModal((m) => ({ ...m, email, error: "" }))}
            onContinue={handleModalContinue}
            onPayPalSuccess={handlePayPalSuccess}
            onPayPalError={handlePayPalError}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && <Toast key="toast" message={toast.message} type={toast.type} />}
      </AnimatePresence>
    </section>
  );
}
