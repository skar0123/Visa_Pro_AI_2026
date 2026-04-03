"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface Product {
  icon: string;
  name: string;
  tag: string;
  description: string;
  cta: string;
  href?: string;
  status: "live" | "soon";
  accentColor: string;
}

const PRODUCTS: Product[] = [
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
  },
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

function ProductCard({ product, index }: { product: Product; index: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        borderRadius: 20,
        padding: "28px 28px 24px",
        background: hovered
          ? "rgba(13,16,26,0.95)"
          : "rgba(10,12,20,0.8)",
        border: `1px solid ${hovered ? product.accentColor + "40" : "rgba(255,255,255,0.07)"}`,
        backdropFilter: "blur(12px)",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        transition: "transform 0.25s ease, border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease",
        boxShadow: hovered
          ? `0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px ${product.accentColor}25, 0 0 40px ${product.accentColor}12`
          : "0 4px 24px rgba(0,0,0,0.2)",
        cursor: "default",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Status badge */}
      {product.status === "live" && (
        <div
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.06em",
            color: "#10b981",
            background: "rgba(16,185,129,0.1)",
            border: "1px solid rgba(16,185,129,0.25)",
            borderRadius: 999,
            padding: "3px 9px",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", animation: "pulse 2s ease-in-out infinite" }} />
          LIVE
        </div>
      )}

      {/* Icon */}
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: `linear-gradient(135deg, ${product.accentColor}18, ${product.accentColor}08)`,
          border: `1px solid ${product.accentColor}25`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          marginBottom: 20,
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
          opacity: 0.8,
          marginBottom: 8,
        }}
      >
        {product.tag}
      </div>

      {/* Name */}
      <h3
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: "#fff",
          marginBottom: 12,
          letterSpacing: "-0.02em",
        }}
      >
        {product.name}
      </h3>

      {/* Description */}
      <p
        style={{
          fontSize: 13.5,
          color: "rgba(148,163,184,0.75)",
          lineHeight: 1.7,
          flex: 1,
          marginBottom: 24,
        }}
      >
        {product.description}
      </p>

      {/* Divider */}
      <div style={{ height: 1, background: `linear-gradient(90deg, ${product.accentColor}20, transparent)`, marginBottom: 20 }} />

      {/* CTA */}
      {product.href && product.status === "live" ? (
        <Link href={product.href} style={{ textDecoration: "none" }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            style={{
              width: "100%",
              padding: "11px 20px",
              borderRadius: 10,
              border: "none",
              background: `linear-gradient(135deg, ${product.accentColor}cc, ${product.accentColor})`,
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: `0 4px 20px ${product.accentColor}30`,
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
      ) : (
        <button
          disabled
          style={{
            width: "100%",
            padding: "11px 20px",
            borderRadius: 10,
            border: `1px solid rgba(255,255,255,0.08)`,
            background: "rgba(255,255,255,0.04)",
            color: "rgba(100,116,139,0.6)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "not-allowed",
          }}
        >
          {product.cta}
        </button>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </motion.div>
  );
}

export default function Products() {
  return (
    <section
      id="products"
      style={{
        padding: "120px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background accent */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 900, height: 500, background: "radial-gradient(ellipse, rgba(0,102,255,0.05) 0%, transparent 70%)" }} />
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Section header */}
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
            <span style={{ background: "linear-gradient(135deg, #0099ff, #00d4ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
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
            Each product is purpose-built for a specific domain — powered by the same intelligent AI infrastructure.
          </p>
        </motion.div>

        {/* Product grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 20,
          }}
        >
          {PRODUCTS.map((p, i) => (
            <ProductCard key={p.name} product={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
