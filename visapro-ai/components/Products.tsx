"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  icon: string;
  name: string;
  tag: string;
  description: string;
  cta: string;
  href?: string;
  status: "live" | "soon";
  accentColor: string;
  isNew?: boolean;
  isFlagship?: boolean;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const CORE_PRODUCTS: Product[] = [
  {
    icon: "🛂",
    name: "VisaPro AI",
    tag: "Immigration Intelligence",
    description:
      "AI-powered immigration profile analyzer for EB-1A, EB-2 NIW, and O-1A extraordinary ability visas. Get attorney-grade gap analysis, RFE predictions, and a 12-month strategy roadmap.",
    cta: "Open App",
    href: "/dashboard",
    status: "live",
    accentColor: "#00d4ff",
    isFlagship: true,
  },
  {
    icon: "🏆",
    name: "ProfileForge AI",
    tag: "Immigration Intelligence",
    description:
      "AI-powered profile builder that analyzes user background and generates optimized achievements, EB1/NIW positioning, and strategic improvement roadmap.",
    cta: "Open App",
    href: "/profile-forge",
    status: "live",
    accentColor: "#a855f7",
    isNew: true,
  },
];

const UPCOMING_PRODUCTS: Product[] = [
  {
    icon: "📄",
    name: "Resume Analyzer",
    tag: "Career Intelligence",
    description:
      "AI engine that evaluates resumes against role-specific criteria, scores candidate fit, identifies weaknesses, and generates improvement recommendations.",
    cta: "Coming Soon",
    status: "soon",
    accentColor: "#8b5cf6",
  },
  {
    icon: "📬",
    name: "Gmail Classifier",
    tag: "Email Automation",
    description:
      "AI-based email categorization and automation system. Automatically label, prioritize, and route incoming messages using custom-trained classification models.",
    cta: "Coming Soon",
    status: "soon",
    accentColor: "#f59e0b",
  },
  {
    icon: "🗒️",
    name: "Meeting Notes Tracker",
    tag: "Productivity AI",
    description:
      "Automatically summarize and track meeting insights using AI. Extracts action items, decisions, and follow-ups — and syncs them to your workflow tools.",
    cta: "Coming Soon",
    status: "soon",
    accentColor: "#10b981",
  },
];

// ─── Cards ────────────────────────────────────────────────────────────────────

function CoreProductCard({ product, index }: { product: Product; index: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.12 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        borderRadius: 22,
        padding: "32px 32px 28px",
        background: hovered
          ? "rgba(13,16,26,0.98)"
          : product.isFlagship
          ? `rgba(0,212,255,0.03)`
          : "rgba(10,12,20,0.85)",
        border: `1px solid ${
          hovered
            ? product.accentColor + "55"
            : product.isFlagship
            ? product.accentColor + "30"
            : "rgba(255,255,255,0.08)"
        }`,
        backdropFilter: "blur(16px)",
        transform: hovered ? "translateY(-7px)" : "translateY(0)",
        transition:
          "transform 0.25s ease, border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease",
        boxShadow: hovered
          ? `0 24px 64px rgba(0,0,0,0.45), 0 0 0 1px ${product.accentColor}30, 0 0 50px ${product.accentColor}14`
          : product.isFlagship
          ? `0 0 0 1px ${product.accentColor}18, 0 8px 40px ${product.accentColor}0a`
          : "0 4px 24px rgba(0,0,0,0.2)",
        cursor: "default",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Flagship glow strip */}
      {product.isFlagship && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 24,
            right: 24,
            height: 2,
            borderRadius: "0 0 4px 4px",
            background: `linear-gradient(90deg, transparent, ${product.accentColor}80, transparent)`,
          }}
        />
      )}

      {/* Top badges row */}
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {product.isFlagship && (
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: product.accentColor,
              background: `${product.accentColor}12`,
              border: `1px solid ${product.accentColor}35`,
              borderRadius: 999,
              padding: "3px 9px",
            }}
          >
            ★ FLAGSHIP
          </div>
        )}
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.06em",
            color: product.isNew ? product.accentColor : "#10b981",
            background: product.isNew
              ? `${product.accentColor}15`
              : "rgba(16,185,129,0.1)",
            border: `1px solid ${
              product.isNew
                ? product.accentColor + "40"
                : "rgba(16,185,129,0.25)"
            }`,
            borderRadius: 999,
            padding: "3px 9px",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: product.isNew ? product.accentColor : "#10b981",
              animation: "pulse 2s ease-in-out infinite",
            }}
          />
          {product.isNew ? "NEW" : "LIVE"}
        </div>
      </div>

      {/* Icon */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: `linear-gradient(135deg, ${product.accentColor}20, ${product.accentColor}09)`,
          border: `1px solid ${product.accentColor}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 26,
          marginBottom: 22,
          transition: "transform 0.2s ease",
          transform: hovered ? "scale(1.08)" : "scale(1)",
        }}
      >
        {product.icon}
      </div>

      {/* Tag */}
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: product.accentColor,
          opacity: 0.85,
          marginBottom: 8,
        }}
      >
        {product.tag}
      </div>

      {/* Name */}
      <h3
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: "#fff",
          marginBottom: 12,
          letterSpacing: "-0.025em",
        }}
      >
        {product.name}
      </h3>

      {/* Description */}
      <p
        style={{
          fontSize: 14,
          color: "rgba(148,163,184,0.78)",
          lineHeight: 1.7,
          flex: 1,
          marginBottom: 28,
        }}
      >
        {product.description}
      </p>

      {/* Divider */}
      <div
        style={{
          height: 1,
          background: `linear-gradient(90deg, ${product.accentColor}25, transparent)`,
          marginBottom: 22,
        }}
      />

      {/* CTA */}
      <Link href={product.href!} style={{ textDecoration: "none" }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          style={{
            width: "100%",
            padding: "13px 20px",
            borderRadius: 11,
            border: "none",
            background: `linear-gradient(135deg, ${product.accentColor}cc, ${product.accentColor})`,
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: `0 4px 24px ${product.accentColor}35`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {product.cta}
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </motion.button>
      </Link>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </motion.div>
  );
}

function UpcomingProductCard({ product, index }: { product: Product; index: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, delay: index * 0.1 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        borderRadius: 18,
        padding: "24px 24px 20px",
        background: hovered ? "rgba(13,16,26,0.7)" : "rgba(8,10,18,0.55)",
        border: `1px solid ${hovered ? product.accentColor + "25" : "rgba(255,255,255,0.05)"}`,
        backdropFilter: "blur(12px)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        transition:
          "transform 0.25s ease, border-color 0.25s ease, background 0.25s ease",
        boxShadow: hovered
          ? `0 12px 40px rgba(0,0,0,0.3), 0 0 24px ${product.accentColor}0a`
          : "0 2px 16px rgba(0,0,0,0.15)",
        cursor: "default",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        opacity: 0.85,
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: `linear-gradient(135deg, ${product.accentColor}12, ${product.accentColor}06)`,
          border: `1px solid ${product.accentColor}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          marginBottom: 16,
          transition: "transform 0.2s ease",
          transform: hovered ? "scale(1.06)" : "scale(1)",
        }}
      >
        {product.icon}
      </div>

      {/* Tag */}
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: product.accentColor,
          opacity: 0.65,
          marginBottom: 6,
        }}
      >
        {product.tag}
      </div>

      {/* Name */}
      <h3
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: "rgba(255,255,255,0.75)",
          marginBottom: 10,
          letterSpacing: "-0.01em",
        }}
      >
        {product.name}
      </h3>

      {/* Description */}
      <p
        style={{
          fontSize: 12.5,
          color: "rgba(148,163,184,0.5)",
          lineHeight: 1.65,
          flex: 1,
          marginBottom: 20,
        }}
      >
        {product.description}
      </p>

      {/* Divider */}
      <div
        style={{
          height: 1,
          background: `linear-gradient(90deg, ${product.accentColor}12, transparent)`,
          marginBottom: 16,
        }}
      />

      {/* Coming Soon pill */}
      <div
        style={{
          width: "100%",
          padding: "9px 16px",
          borderRadius: 9,
          border: `1px solid rgba(255,255,255,0.07)`,
          background: "rgba(255,255,255,0.03)",
          color: "rgba(100,116,139,0.5)",
          fontSize: 12,
          fontWeight: 600,
          textAlign: "center",
          letterSpacing: "0.03em",
        }}
      >
        Coming Soon
      </div>
    </motion.div>
  );
}

// ─── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({
  label,
  delay,
}: {
  label: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: delay ?? 0 }}
      style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "rgba(148,163,184,0.5)",
        }}
      >
        {label}
      </span>
      <div
        style={{
          flex: 1,
          height: 1,
          background:
            "linear-gradient(90deg, rgba(255,255,255,0.08), transparent)",
        }}
      />
    </motion.div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export default function Products() {
  return (
    <section
      id="products"
      style={{ padding: "120px 24px", position: "relative", overflow: "hidden" }}
    >
      {/* Background accent */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 900,
            height: 500,
            background:
              "radial-gradient(ellipse, rgba(0,102,255,0.05) 0%, transparent 70%)",
          }}
        />
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* ── Section header ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: 72 }}
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
            Our Products
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
            AI Tools Built for{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #0099ff, #00d4ff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Real Problems
            </span>
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "rgba(100,116,139,0.8)",
              maxWidth: 500,
              margin: "0 auto",
              lineHeight: 1.65,
            }}
          >
            Each product is purpose-built for a specific domain — powered by the
            same intelligent AI infrastructure.
          </p>
        </motion.div>

        {/* ── Core Products ───────────────────────────────────────────── */}
        <SectionLabel label="Core Products" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 24,
            marginBottom: 64,
          }}
        >
          {CORE_PRODUCTS.map((p, i) => (
            <CoreProductCard key={p.name} product={p} index={i} />
          ))}
        </div>

        {/* ── Upcoming Tools ──────────────────────────────────────────── */}
        <SectionLabel label="Upcoming Tools" delay={0.1} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {UPCOMING_PRODUCTS.map((p, i) => (
            <UpcomingProductCard key={p.name} product={p} index={i} />
          ))}
        </div>

      </div>
    </section>
  );
}
