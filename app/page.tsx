"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import Logo from "@/components/Logo";

const Background3D = dynamic(() => import("@/components/Background3D"), { ssr: false });

const features = [
  {
    icon: "⚡",
    title: "Instant Analysis",
    desc: "Get your profile evaluated in seconds using our AI scoring engine trained on immigration case patterns.",
  },
  {
    icon: "⚖️",
    title: "Attorney-Grade Gaps",
    desc: "Receive gap analysis written like an immigration attorney — referencing actual USCIS criteria and CFR standards.",
  },
  {
    icon: "🎯",
    title: "Actionable Suggestions",
    desc: "Step-by-step improvement recommendations tailored to O-1A and EB-1 extraordinary ability classifications.",
  },
  {
    icon: "📊",
    title: "Section Scoring",
    desc: "Detailed breakdown across Education, Experience, and Skills — see exactly where you stand.",
  },
];

const stats = [
  { value: "94%", label: "Accuracy Rate" },
  { value: "12K+", label: "Profiles Analyzed" },
  { value: "8 CFR", label: "Criteria Covered" },
  { value: "<10s", label: "Analysis Time" },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen grid-bg overflow-hidden">
      <Background3D />
      {/* Nav */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{
          background: "linear-gradient(to bottom, rgba(3,5,15,0.95) 0%, transparent 100%)",
          backdropFilter: "blur(8px)",
        }}
      >
        <Link href="/" style={{ textDecoration: "none" }}>
          <Logo size={30} />
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="hidden sm:block text-slate-400 hover:text-cyan-400 text-sm transition-colors"
          >
            Dashboard
          </Link>
          <Link href="/dashboard">
            <button className="btn-primary text-white text-sm font-semibold px-5 py-2 rounded-lg relative">
              <span className="relative z-10">Get Started</span>
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 pt-20 pb-16 text-center">
        {/* Background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(0,102,255,0.08) 0%, transparent 70%)" }}
          />
          <div
            className="absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(0,212,255,0.05) 0%, transparent 70%)" }}
          />
          <div
            className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)" }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium mb-8"
            style={{
              background: "rgba(0,212,255,0.08)",
              border: "1px solid rgba(0,212,255,0.2)",
              color: "#00d4ff",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            AI-Powered Immigration Profile Analysis
          </motion.div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight mb-6">
            <span className="gradient-text-alt">Your AI</span>
            <br />
            <span className="gradient-text">Visa Analyst</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Submit your profile. Get an instant score, attorney-grade gap analysis, and a detailed
            improvement roadmap — powered by AI trained on O-1A and EB-1 extraordinary ability criteria.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="btn-primary text-white font-semibold px-8 py-4 rounded-xl text-lg relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Analyze My Profile
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </motion.button>
            </Link>
            <a
              href="#how-it-works"
              className="text-slate-400 hover:text-cyan-400 font-medium px-8 py-4 rounded-xl transition-colors flex items-center gap-2 text-lg"
              style={{ border: "1px solid rgba(0,212,255,0.15)" }}
            >
              See How It Works
            </a>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="relative z-10 mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto w-full"
        >
          {stats.map((stat, i) => (
            <div key={i} className="glass-card rounded-xl px-4 py-5 text-center glow-cyan">
              <div className="text-2xl sm:text-3xl font-bold gradient-text mb-1">{stat.value}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="text-sm font-medium mb-3" style={{ color: "#00d4ff" }}>
              THE PROCESS
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              How Visapro AI Works
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              A four-stage pipeline that mirrors how immigration attorneys evaluate visa petitions.
            </p>
          </motion.div>

          <div className="relative">
            <div
              className="hidden md:block absolute top-12 left-[calc(12.5%+20px)] right-[calc(12.5%+20px)] h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(0,212,255,0.3), rgba(0,102,255,0.3), transparent)",
              }}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { step: "01", icon: "📋", title: "Input", desc: "Enter your education, experience, and skills" },
                { step: "02", icon: "🔍", title: "Parsing", desc: "AI extracts structured entities and keywords" },
                { step: "03", icon: "⚙️", title: "Evaluation", desc: "Scoring against USCIS extraordinary ability criteria" },
                { step: "04", icon: "📄", title: "Report", desc: "Instant attorney-style analysis with suggestions" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="glass-card rounded-2xl p-6 text-center"
                >
                  <div className="text-xs font-mono mb-3" style={{ color: "rgba(0,212,255,0.5)" }}>
                    STEP {item.step}
                  </div>
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <div className="text-white font-semibold mb-2">{item.title}</div>
                  <div className="text-slate-500 text-sm">{item.desc}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="text-sm font-medium mb-3" style={{ color: "#00d4ff" }}>
              CAPABILITIES
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">What You Get</h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass-card rounded-2xl p-6 flex gap-5"
              >
                <div className="text-3xl flex-shrink-0 mt-1">{f.icon}</div>
                <div>
                  <div className="text-white font-semibold mb-2">{f.title}</div>
                  <div className="text-slate-400 text-sm leading-relaxed">{f.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-card rounded-3xl p-10 sm:p-16 text-center glow-cyan-strong relative overflow-hidden"
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse at 50% 0%, rgba(0,102,255,0.1) 0%, transparent 60%)",
              }}
            />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 relative z-10">
              Ready to Know Where You Stand?
            </h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto relative z-10">
              Takes less than 60 seconds. No account required. Get your visa readiness score instantly.
            </p>
            <Link href="/dashboard" className="relative z-10 inline-block">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="btn-primary text-white font-semibold px-10 py-4 rounded-xl text-lg relative overflow-hidden"
              >
                <span className="relative z-10">Start Free Analysis →</span>
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="border-t py-8 px-6 text-center"
        style={{ borderColor: "rgba(0,212,255,0.1)" }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #0066ff, #00d4ff)" }}
          >
            <span className="text-white text-xs font-bold">V</span>
          </div>
          <span className="text-white font-medium">Visapro AI</span>
        </div>
        <p className="text-slate-600 text-sm">
          For informational purposes only. Not legal advice. Consult a licensed immigration attorney.
        </p>
      </footer>
    </main>
  );
}
