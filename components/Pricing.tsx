"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  name: string;
  price: number;
  period: string;
  description: string;
  features: PlanFeature[];
  cta: string;
  popular: boolean;
  accentColor: string;
  glowColor: string;
}

const PLANS: Plan[] = [
  {
    name: "Free",
    price: 0,
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
      { text: "USCIS-style gap analysis", included: false },
      { text: "Visa probability scoring", included: false },
      { text: "12-month improvement roadmap", included: false },
      { text: "RFE risk detection", included: false },
      { text: "Interview prep insights", included: false },
      { text: "Downloadable PDF report", included: false },
    ],
  },
  {
    name: "Pro",
    price: 29,
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
    name: "Premium",
    price: 99,
    period: "per month",
    description: "The complete toolkit for professionals pursuing extraordinary ability visas.",
    accentColor: "#a78bfa",
    glowColor: "rgba(139,92,246,0.15)",
    popular: false,
    cta: "Get Premium",
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

function PricingCard({ plan, index }: { plan: Plan; index: number }) {
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
        background: plan.popular
          ? "rgba(0,212,255,0.04)"
          : "rgba(10,12,20,0.7)",
        border: plan.popular
          ? `1px solid rgba(0,212,255,${hovered ? "0.5" : "0.28"})`
          : `1px solid rgba(255,255,255,${hovered ? "0.12" : "0.07"})`,
        backdropFilter: "blur(12px)",
        transform: hovered ? "translateY(-8px) scale(1.01)" : plan.popular ? "translateY(-4px)" : "translateY(0)",
        transition: "transform 0.28s ease, border-color 0.28s ease, box-shadow 0.28s ease",
        boxShadow: hovered
          ? `0 24px 64px rgba(0,0,0,0.45), 0 0 0 1px ${plan.accentColor}30, 0 0 60px ${plan.glowColor}`
          : plan.popular
          ? `0 16px 48px rgba(0,0,0,0.3), 0 0 40px rgba(0,212,255,0.08)`
          : "0 4px 24px rgba(0,0,0,0.2)",
      }}
    >
      {/* Popular badge */}
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

      {/* Plan name + description */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: plan.accentColor,
            marginBottom: 8,
            opacity: 0.9,
          }}
        >
          {plan.name}
        </div>
        <p style={{ fontSize: 13, color: "rgba(100,116,139,0.75)", lineHeight: 1.6, margin: 0 }}>
          {plan.description}
        </p>
      </div>

      {/* Price */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 28 }}>
        <span style={{ fontSize: 13, color: "rgba(148,163,184,0.6)", marginBottom: 8 }}>$</span>
        <span
          style={{
            fontSize: 52,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            color: "#fff",
            background: plan.popular
              ? "linear-gradient(135deg, #fff 40%, rgba(0,212,255,0.9) 100%)"
              : undefined,
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

      {/* Divider */}
      <div
        style={{
          height: 1,
          background: `linear-gradient(90deg, ${plan.accentColor}25, transparent)`,
          marginBottom: 24,
        }}
      />

      {/* Features list */}
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

      {/* CTA */}
      <Link href="/dashboard" style={{ textDecoration: "none" }}>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          style={{
            width: "100%",
            padding: "13px 20px",
            borderRadius: 12,
            border: plan.popular ? "none" : `1px solid ${plan.accentColor}35`,
            background: plan.popular
              ? "linear-gradient(135deg, #0055ee 0%, #00d4ff 100%)"
              : `${plan.accentColor}0d`,
            color: plan.popular ? "#fff" : plan.accentColor,
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: plan.popular ? "0 4px 24px rgba(0,153,255,0.35)" : "none",
            transition: "box-shadow 0.2s ease",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {plan.popular && (
            <span
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)",
                animation: "shimmer 2.5s infinite",
              }}
            />
          )}
          <span style={{ position: "relative" }}>{plan.cta} →</span>
        </motion.button>
      </Link>

      <style>{`@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
    </motion.div>
  );
}

export default function Pricing() {
  return (
    <section
      id="pricing"
      style={{ padding: "120px 24px", position: "relative", overflow: "hidden" }}
    >
      {/* Background glow */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 900,
            height: 600,
            background: "radial-gradient(ellipse, rgba(0,102,255,0.06) 0%, transparent 65%)",
          }}
        />
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: 80 }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "5px 14px",
              borderRadius: 999,
              background: "rgba(0,212,255,0.07)",
              border: "1px solid rgba(0,212,255,0.18)",
              color: "#00d4ff",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 20,
            }}
          >
            Pricing
          </div>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 48px)",
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "-0.03em",
              marginBottom: 16,
              lineHeight: 1.15,
            }}
          >
            Simple,{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #0099ff, #00d4ff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Transparent
            </span>{" "}
            Pricing
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "rgba(100,116,139,0.75)",
              maxWidth: 460,
              margin: "0 auto",
              lineHeight: 1.65,
            }}
          >
            Start free. Upgrade when you need the full power of AI-driven immigration analysis.
          </p>
        </motion.div>

        {/* Cards grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 24,
            alignItems: "start",
          }}
        >
          {PLANS.map((plan, i) => (
            <PricingCard key={plan.name} plan={plan} index={i} />
          ))}
        </div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          style={{
            textAlign: "center",
            marginTop: 40,
            fontSize: 13,
            color: "rgba(100,116,139,0.5)",
          }}
        >
          All plans include secure, in-session processing. No data stored without consent.{" "}
          <a href="mailto:contact@neuralopsai.in" style={{ color: "rgba(0,212,255,0.6)", textDecoration: "none" }}>
            Contact us
          </a>{" "}
          for enterprise pricing.
        </motion.p>
      </div>
    </section>
  );
}
