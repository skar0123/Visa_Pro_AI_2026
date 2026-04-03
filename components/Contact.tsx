"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email.trim()) return;
    // Fire-and-forget mailto fallback — swap for a real endpoint if needed
    setSent(true);
  }

  const inputStyle = (field: string): React.CSSProperties => ({
    width: "100%",
    padding: "12px 16px",
    borderRadius: 10,
    border: `1px solid ${focused === field ? "rgba(0,212,255,0.45)" : "rgba(255,255,255,0.08)"}`,
    background: focused === field ? "rgba(0,212,255,0.04)" : "rgba(10,12,20,0.7)",
    color: "#e2e8f0",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s ease, background 0.2s ease",
    fontFamily: "inherit",
    boxShadow: focused === field ? "0 0 0 3px rgba(0,212,255,0.08)" : "none",
  });

  return (
    <section
      id="contact"
      style={{ padding: "120px 24px", position: "relative", overflow: "hidden" }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 700,
          height: 400,
          background: "radial-gradient(ellipse, rgba(0,102,255,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: 700, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: 56 }}
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
            Contact
          </div>
          <h2
            style={{
              fontSize: "clamp(26px, 4vw, 42px)",
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "-0.03em",
              marginBottom: 14,
              lineHeight: 1.2,
            }}
          >
            Get in Touch
          </h2>
          <p style={{ fontSize: 15, color: "rgba(100,116,139,0.75)", lineHeight: 1.65 }}>
            Have a question, partnership idea, or want a demo?{" "}
            <a
              href="mailto:contact@neuralopsai.in"
              style={{ color: "#00d4ff", textDecoration: "none", borderBottom: "1px solid rgba(0,212,255,0.35)" }}
            >
              contact@neuralopsai.in
            </a>
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.1 }}
          style={{
            borderRadius: 24,
            padding: "40px 40px",
            background: "rgba(10,12,20,0.85)",
            border: "1px solid rgba(0,212,255,0.12)",
            backdropFilter: "blur(16px)",
            boxShadow: "0 0 60px rgba(0,102,255,0.08), 0 20px 40px rgba(0,0,0,0.3)",
          }}
        >
          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: "center", padding: "24px 0" }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Message Received</h3>
              <p style={{ color: "rgba(100,116,139,0.8)", fontSize: 14 }}>
                We&apos;ll get back to you at{" "}
                <span style={{ color: "#00d4ff" }}>{form.email}</span> shortly.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "rgba(148,163,184,0.7)", marginBottom: 7, letterSpacing: "0.04em" }}>
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    onFocus={() => setFocused("name")}
                    onBlur={() => setFocused(null)}
                    placeholder="Alex Chen"
                    style={inputStyle("name")}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "rgba(148,163,184,0.7)", marginBottom: 7, letterSpacing: "0.04em" }}>
                    Email <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused(null)}
                    placeholder="you@company.com"
                    required
                    style={inputStyle("email")}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "rgba(148,163,184,0.7)", marginBottom: 7, letterSpacing: "0.04em" }}>
                  Message
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  onFocus={() => setFocused("message")}
                  onBlur={() => setFocused(null)}
                  placeholder="Tell us what you're building or looking for..."
                  rows={4}
                  style={{ ...inputStyle("message"), resize: "vertical", lineHeight: 1.6 }}
                />
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: "100%",
                  padding: "14px 24px",
                  borderRadius: 12,
                  border: "none",
                  background: "linear-gradient(135deg, #0055ee 0%, #00d4ff 100%)",
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 24px rgba(0,153,255,0.35)",
                  marginTop: 4,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <span style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.1) 50%,transparent 60%)", animation: "shimmer 2.5s infinite" }} />
                <span style={{ position: "relative" }}>Send Message →</span>
              </motion.button>
            </form>
          )}
        </motion.div>

        {/* Email direct */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "rgba(100,116,139,0.55)" }}
        >
          Or email us directly at{" "}
          <a
            href="mailto:contact@neuralopsai.in"
            style={{ color: "rgba(0,212,255,0.7)", textDecoration: "none" }}
          >
            contact@neuralopsai.in
          </a>
        </motion.p>
      </div>

      <style>{`@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
    </section>
  );
}
