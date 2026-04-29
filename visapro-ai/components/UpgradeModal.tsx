"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { Plan } from "@/lib/access";

interface Props {
  open: boolean;
  onClose: () => void;
  requiredPlan: Plan;
  featureLabel: string;
}

const PLAN_DETAILS: Record<"PRO" | "PREMIUM", {
  color: string;
  price: string;
  badge: string;
  features: string[];
}> = {
  PRO: {
    color: "#00d4ff",
    price: "₹4,999 / $60",
    badge: "Most Popular",
    features: [
      "Full AI visa evaluation",
      "USCIS-style gap analysis",
      "Visa probability scoring (EB-1A, NIW, O-1A)",
      "12-month improvement roadmap",
      "RFE risk detection",
      "Approval simulation",
      "Basic PDF export",
    ],
  },
  PREMIUM: {
    color: "#a78bfa",
    price: "₹8,999 / $108",
    badge: "Attorney-Level",
    features: [
      "Everything in Pro",
      "Full downloadable PDF report",
      "AI Interview Simulator (real-time Q&A)",
      "Attorney-grade petition checklist",
      "Advanced case strategy (deep insights)",
      "Priority AI analysis",
      "Unlimited evaluations",
    ],
  },
};

export default function UpgradeModal({ open, onClose, requiredPlan, featureLabel }: Props) {
  if (requiredPlan === "FREE") return null;
  const plan = PLAN_DETAILS[requiredPlan as "PRO" | "PREMIUM"];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(3,5,15,0.85)",
              backdropFilter: "blur(8px)",
              zIndex: 1000,
            }}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 1001,
              width: "min(480px, calc(100vw - 32px))",
              background: "rgba(10,12,22,0.98)",
              border: `1px solid ${plan.color}35`,
              borderRadius: 20,
              padding: "32px 28px",
              boxShadow: `0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px ${plan.color}15`,
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                width: 30,
                height: 30,
                cursor: "pointer",
                color: "#64748b",
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ×
            </button>

            {/* Lock icon */}
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: `${plan.color}15`,
                border: `1px solid ${plan.color}35`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                marginBottom: 20,
              }}
            >
              🔒
            </div>

            {/* Headline */}
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: plan.color,
                marginBottom: 8,
              }}
            >
              {plan.badge} · {requiredPlan} Plan Required
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 8, lineHeight: 1.3 }}>
              Unlock {featureLabel}
            </h2>
            <p style={{ fontSize: 13, color: "rgba(100,116,139,0.8)", marginBottom: 24, lineHeight: 1.65 }}>
              This feature is part of the <strong style={{ color: "#e2e8f0" }}>{requiredPlan}</strong> plan.
              Upgrade to get access to attorney-level visa intelligence.
            </p>

            {/* Features list */}
            <div
              style={{
                background: `${plan.color}08`,
                border: `1px solid ${plan.color}18`,
                borderRadius: 12,
                padding: "16px 18px",
                marginBottom: 24,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: plan.color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                What&apos;s included in {requiredPlan}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {plan.features.map((f) => (
                  <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "rgba(203,213,225,0.85)" }}>
                    <span style={{ color: plan.color, flexShrink: 0, marginTop: 1 }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Premium positioning */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
              {["Attorney-level insights", "Used for EB-1A / O-1 success", "Deep AI evaluation engine"].map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: "3px 10px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(148,163,184,0.8)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Pricing + CTA */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>{plan.price}</div>
                <div style={{ fontSize: 11, color: "rgba(100,116,139,0.7)" }}>per month</div>
              </div>
              <Link href="/#pricing" onClick={onClose} style={{ textDecoration: "none" }}>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    padding: "13px 28px",
                    borderRadius: 12,
                    border: "none",
                    background: requiredPlan === "PREMIUM"
                      ? "linear-gradient(135deg, #7c3aed, #a78bfa)"
                      : "linear-gradient(135deg, #0055ee, #00d4ff)",
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: `0 4px 20px ${plan.color}35`,
                    whiteSpace: "nowrap",
                  }}
                >
                  Upgrade to {requiredPlan} →
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
