"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const LINKS = [
  { label: "Home", href: "#home" },
  { label: "Products", href: "#products" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" },
];

function scrollTo(id: string) {
  const el = document.querySelector(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "0 32px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: scrolled
            ? "rgba(3,5,15,0.92)"
            : "rgba(3,5,15,0.6)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: scrolled
            ? "1px solid rgba(0,212,255,0.12)"
            : "1px solid transparent",
          transition: "background 0.3s ease, border-color 0.3s ease",
        }}
      >
        {/* Logo */}
        <button
          onClick={() => scrollTo("#home")}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 10 }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: "linear-gradient(135deg, #0055ee 0%, #00d4ff 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 0 16px rgba(0,212,255,0.35)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" fill="white" />
              <circle cx="4" cy="4" r="2" fill="white" opacity="0.7" />
              <circle cx="20" cy="4" r="2" fill="white" opacity="0.7" />
              <circle cx="4" cy="20" r="2" fill="white" opacity="0.7" />
              <circle cx="20" cy="20" r="2" fill="white" opacity="0.7" />
              <line x1="12" y1="12" x2="4" y2="4" stroke="white" strokeWidth="1.2" opacity="0.5" />
              <line x1="12" y1="12" x2="20" y2="4" stroke="white" strokeWidth="1.2" opacity="0.5" />
              <line x1="12" y1="12" x2="4" y2="20" stroke="white" strokeWidth="1.2" opacity="0.5" />
              <line x1="12" y1="12" x2="20" y2="20" stroke="white" strokeWidth="1.2" opacity="0.5" />
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#fff", letterSpacing: "-0.02em" }}>
            NeuralOps{" "}
            <span style={{ background: "linear-gradient(90deg, #0099ff, #00d4ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              AI
            </span>
          </span>
        </button>

        {/* Desktop links */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }} className="hide-mobile">
          {LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollTo(link.href)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "7px 16px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                color: "rgba(148,163,184,0.85)",
                transition: "color 0.15s ease, background 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.color = "#fff";
                (e.target as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.color = "rgba(148,163,184,0.85)";
                (e.target as HTMLButtonElement).style.background = "none";
              }}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }} className="hide-mobile">
          <button
            onClick={() => scrollTo("#products")}
            style={{
              padding: "8px 18px",
              borderRadius: 9,
              border: "1px solid rgba(0,212,255,0.25)",
              background: "transparent",
              color: "#00d4ff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget).style.background = "rgba(0,212,255,0.08)";
              (e.currentTarget).style.borderColor = "rgba(0,212,255,0.5)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget).style.background = "transparent";
              (e.currentTarget).style.borderColor = "rgba(0,212,255,0.25)";
            }}
          >
            Explore Products
          </button>
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <button
              style={{
                padding: "8px 18px",
                borderRadius: 9,
                border: "none",
                background: "linear-gradient(135deg, #0055ee 0%, #00d4ff 100%)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 0 20px rgba(0,153,255,0.3)",
                transition: "opacity 0.2s ease, transform 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget).style.opacity = "0.88";
                (e.currentTarget).style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget).style.opacity = "1";
                (e.currentTarget).style.transform = "translateY(0)";
              }}
            >
              Try VisaPro AI →
            </button>
          </Link>
        </div>

        {/* Hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="show-mobile"
          style={{
            background: "none",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            padding: "6px 10px",
            cursor: "pointer",
            color: "#fff",
            fontSize: 18,
            lineHeight: 1,
          }}
        >
          {open ? "✕" : "☰"}
        </button>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed",
              top: 64,
              left: 0,
              right: 0,
              zIndex: 99,
              background: "rgba(3,5,15,0.97)",
              backdropFilter: "blur(16px)",
              borderBottom: "1px solid rgba(0,212,255,0.1)",
              padding: "16px 24px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {LINKS.map((link) => (
              <button
                key={link.href}
                onClick={() => { scrollTo(link.href); setOpen(false); }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "12px 16px",
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 500,
                  color: "rgba(148,163,184,0.9)",
                  textAlign: "left",
                }}
              >
                {link.label}
              </button>
            ))}
            <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 0" }} />
            <Link href="/dashboard" style={{ textDecoration: "none" }} onClick={() => setOpen(false)}>
              <button
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 9,
                  border: "none",
                  background: "linear-gradient(135deg, #0055ee, #00d4ff)",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Try VisaPro AI →
              </button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          .show-mobile { display: block !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </>
  );
}
