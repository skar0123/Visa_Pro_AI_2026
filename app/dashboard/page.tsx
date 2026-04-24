"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";

interface FormData {
  name: string;
  email: string;
  linkedin: string;
  education: string;
  experience: string;
  skills: string;
}

const CHAR_LIMITS = { education: 1200, experience: 1200, skills: 800 };
const HISTORY_KEY = "visapro_history";

function saveToHistory(result: Record<string, unknown>, name: string) {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    const entry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      name: name || "Anonymous",
      overall_score: result.overall_score,
      visa_probabilities: result.visa_probabilities,
      top_strength: Array.isArray(result.strengths) ? result.strengths[0] || "" : "",
      top_gap: Array.isArray(result.gaps) ? result.gaps[0] || "" : "",
    };
    const updated = [entry, ...existing].slice(0, 20); // keep last 20
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch { /* ignore */ }
}

export default function DashboardPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    name: "", email: "", linkedin: "",
    education: "", experience: "", skills: "",
  });
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setFileLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/parse-resume", { method: "POST", body: formData });

      if (res.ok) {
        const parsed = await res.json();
        setForm((prev) => ({
          ...prev,
          education: parsed.education ? (prev.education ? prev.education + "\n" + parsed.education : parsed.education).slice(0, 1200) : prev.education,
          experience: parsed.experience ? (prev.experience ? prev.experience + "\n" + parsed.experience : parsed.experience).slice(0, 1200) : prev.experience,
          skills: parsed.skills ? (prev.skills ? prev.skills + "\n" + parsed.skills : parsed.skills).slice(0, 800) : prev.skills,
        }));
      } else {
        // Fallback: read as text and append to skills
        const reader = new FileReader();
        reader.onload = (ev) => {
          const text = (ev.target?.result as string) || "";
          const cleaned = text.replace(/[^\x20-\x7E\n]/g, " ").replace(/\s+/g, " ").trim().slice(0, 600);
          if (cleaned.length > 10) {
            setForm((prev) => ({
              ...prev,
              skills: prev.skills ? (prev.skills + "\n" + cleaned).slice(0, 800) : cleaned,
            }));
          }
        };
        reader.readAsText(file);
      }
    } catch {
      // Silent fallback
    } finally {
      setFileLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.education.trim() && !form.experience.trim() && !form.skills.trim()) {
      setError("Please fill in at least one section before evaluating.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const profileInputs = {
        name: form.name,
        email: form.email,
        education: form.education,
        experience: form.experience,
        skills: form.skills + (form.linkedin ? `\nLinkedIn: ${form.linkedin}` : ""),
      };

      // Persist inputs so the payment success page can re-evaluate after Stripe redirect.
      localStorage.setItem("visapro_profile_inputs", JSON.stringify(profileInputs));

      // Session cookie (if paid) is sent automatically by the browser — no manual auth header needed.
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileInputs),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Evaluation failed.");
      }
      const result = await res.json();
      const stored = { ...result, applicantName: form.name || "Applicant" };
      sessionStorage.setItem("visapro_result", JSON.stringify(stored));
      saveToHistory(result, form.name);
      router.push("/results");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const sections = [
    {
      key: "education" as const,
      label: "Education",
      sublabel: "Academic background & credentials",
      icon: (
        <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m-4-4l4 4 4-4" />
        </svg>
      ),
      placeholder: "• PhD in Computer Science, Stanford University (2019)\n• Dissertation: \"Large-Scale Distributed ML Systems\"\n• GPA 4.0/4.0, Dean's List, NSF Graduate Research Fellowship\n• Published 3 papers during doctoral study",
      hint: "Include degree level, institution name, field of study, GPA, honors, fellowships, and research.",
    },
    {
      key: "experience" as const,
      label: "Work Experience",
      sublabel: "Professional history & achievements",
      icon: (
        <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      placeholder: "• Staff Software Engineer, Google DeepMind (2019–present, 5 years)\n• Led team of 12 engineers, products serving 500M+ users\n• Principal Engineer, OpenAI (2017–2019, 2 years)\n• Co-authored 3 patents on transformer efficiency",
      hint: "Include years of experience, job titles, company names, team size, and specific measurable achievements.",
    },
    {
      key: "skills" as const,
      label: "Skills & Expertise",
      sublabel: "Technical skills, certifications & publications",
      icon: (
        <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
        </svg>
      ),
      placeholder: "• Languages: Python, C++, Rust, Go, TypeScript\n• AI/ML: PyTorch, TensorFlow, JAX, Transformers\n• Cloud: AWS Certified Solutions Architect, GCP, Kubernetes\n• Published 8 peer-reviewed papers (NeurIPS, ICML, IEEE)\n• IEEE Senior Member, 3 patents filed",
      hint: "List programming languages, frameworks, cloud platforms, certifications, publications, and awards.",
    },
  ];

  const filledCount = [form.education, form.experience, form.skills].filter((v) => v.trim().length > 0).length;
  const inputBase: React.CSSProperties = {
    width: "100%", padding: "12px 16px", borderRadius: 10, color: "#ffffff",
    fontSize: 14, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s, box-shadow 0.2s",
    backgroundColor: "#0d1017",
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#08090f", color: "#ffffff" }}>
      <Navbar />

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "100px 24px 80px" }}>
        {/* Page header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#00d4ff", letterSpacing: "0.1em", marginBottom: 8, textTransform: "uppercase" }}>
            Profile Analysis
          </p>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: "#ffffff", marginBottom: 10, lineHeight: 1.25 }}>
            Enter Your Profile
          </h1>
          <p style={{ fontSize: 15, color: "#94a3b8", lineHeight: 1.65, maxWidth: 540 }}>
            The more detail you provide, the more accurate your visa classification assessment — including EB-1A, EB-2 NIW, O-1A, and EB-5 probability scores.
          </p>
          {/* Progress */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 20 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ height: 4, borderRadius: 2, flex: 1, maxWidth: 60, backgroundColor: i < filledCount ? "#00d4ff" : "rgba(255,255,255,0.1)", transition: "background-color 0.3s ease" }} />
            ))}
            <span style={{ fontSize: 12, color: "#64748b", marginLeft: 4 }}>{filledCount}/3 sections filled</span>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column" }}>

            {/* Name + Email row */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#cbd5e1", marginBottom: 8 }}>
                  Full Name <span style={{ color: "#475569", fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  type="text" name="name" value={form.name} onChange={handleChange}
                  onFocus={() => setFocusedField("name")} onBlur={() => setFocusedField(null)}
                  placeholder="e.g. Dr. Alex Chen"
                  style={{ ...inputBase, border: `1px solid ${focusedField === "name" ? "rgba(0,212,255,0.6)" : "rgba(255,255,255,0.12)"}`, boxShadow: focusedField === "name" ? "0 0 0 3px rgba(0,212,255,0.08)" : "none" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#cbd5e1", marginBottom: 8 }}>
                  Email <span style={{ color: "#475569", fontWeight: 400 }}>(for your report)</span>
                </label>
                <input
                  type="email" name="email" value={form.email} onChange={handleChange}
                  onFocus={() => setFocusedField("email")} onBlur={() => setFocusedField(null)}
                  placeholder="you@example.com"
                  style={{ ...inputBase, border: `1px solid ${focusedField === "email" ? "rgba(0,212,255,0.6)" : "rgba(255,255,255,0.12)"}`, boxShadow: focusedField === "email" ? "0 0 0 3px rgba(0,212,255,0.08)" : "none" }}
                />
              </div>
            </motion.div>

            {/* LinkedIn field */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08 }} style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#cbd5e1", marginBottom: 8 }}>
                LinkedIn Profile URL <span style={{ color: "#475569", fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                type="url" name="linkedin" value={form.linkedin} onChange={handleChange}
                onFocus={() => setFocusedField("linkedin")} onBlur={() => setFocusedField(null)}
                placeholder="https://linkedin.com/in/yourprofile"
                style={{ ...inputBase, border: `1px solid ${focusedField === "linkedin" ? "rgba(0,212,255,0.6)" : "rgba(255,255,255,0.08)"}`, boxShadow: focusedField === "linkedin" ? "0 0 0 3px rgba(0,212,255,0.08)" : "none" }}
              />
              <p style={{ fontSize: 11, color: "#334155", marginTop: 5 }}>
                Paste your LinkedIn URL — our system will factor your public profile context into the assessment.
              </p>
            </motion.div>

            {/* Section cards */}
            {sections.map((section, i) => {
              const limit = CHAR_LIMITS[section.key];
              const count = form[section.key].length;
              const pct = (count / limit) * 100;
              const isFocused = focusedField === section.key;
              const hasContent = count > 0;
              const barColor = pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : "#00d4ff";

              return (
                <motion.div
                  key={section.key}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.07 }}
                  style={{
                    borderRadius: 14,
                    border: `1px solid ${isFocused ? "rgba(0,212,255,0.45)" : hasContent ? "rgba(0,212,255,0.2)" : "rgba(255,255,255,0.1)"}`,
                    backgroundColor: "#0d1017", overflow: "hidden",
                    boxShadow: isFocused ? "0 0 0 3px rgba(0,212,255,0.07), 0 0 24px rgba(0,212,255,0.06)" : "none",
                    transition: "border-color 0.2s, box-shadow 0.2s", marginBottom: 16,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: isFocused || hasContent ? "rgba(0,212,255,0.15)" : "rgba(255,255,255,0.06)", border: `1px solid ${isFocused || hasContent ? "rgba(0,212,255,0.3)" : "rgba(255,255,255,0.08)"}`, display: "flex", alignItems: "center", justifyContent: "center", color: isFocused || hasContent ? "#00d4ff" : "#64748b", flexShrink: 0, transition: "all 0.2s" }}>
                        {section.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "#ffffff", lineHeight: 1.2 }}>{section.label}</div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{section.sublabel}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {hasContent && (
                        <span style={{ fontSize: 11, color: "#10b981", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 999, padding: "2px 8px" }}>✓ Filled</span>
                      )}
                      <span style={{ fontSize: 12, color: pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : "#475569" }}>
                        {count}/{limit}
                      </span>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: "#475569", padding: "8px 20px 0", lineHeight: 1.5 }}>{section.hint}</p>
                  <div style={{ padding: "10px 20px 16px" }}>
                    <textarea
                      name={section.key} value={form[section.key]} onChange={handleChange}
                      onFocus={() => setFocusedField(section.key)} onBlur={() => setFocusedField(null)}
                      placeholder={section.placeholder} maxLength={limit} rows={6}
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "#070a10", color: "#e2e8f0", fontSize: 13, lineHeight: 1.7, resize: "vertical", outline: "none", fontFamily: "var(--font-geist-mono), monospace", boxSizing: "border-box", minHeight: 130 }}
                    />
                    <div style={{ marginTop: 8, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 2, width: `${Math.min(pct, 100)}%`, background: pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : `linear-gradient(90deg, #0066ff, ${barColor})`, transition: "width 0.3s ease, background 0.3s ease" }} />
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* File upload */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }} style={{ marginBottom: 16 }}>
              <input ref={fileRef} type="file" accept=".pdf,.txt,.doc,.docx" onChange={handleFileChange} style={{ display: "none" }} />
              <button type="button" onClick={() => fileRef.current?.click()} style={{ width: "100%", padding: "14px 20px", borderRadius: 10, border: `1px dashed ${fileName ? "rgba(0,212,255,0.4)" : "rgba(255,255,255,0.12)"}`, backgroundColor: fileName ? "rgba(0,212,255,0.04)" : "transparent", color: fileName ? "#00d4ff" : "#64748b", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", transition: "all 0.2s", boxSizing: "border-box" }}>
                <svg style={{ width: 18, height: 18, flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {fileLoading
                  ? <span>Parsing resume...</span>
                  : fileName
                  ? <span>{fileName} — parsed & auto-filled</span>
                  : <span>Upload Resume / CV to Auto-fill <span style={{ color: "#334155" }}>(PDF, TXT — optional)</span></span>
                }
              </button>
            </motion.div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ padding: "12px 16px", borderRadius: 10, backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5", fontSize: 13, marginBottom: 12 }}>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Evaluate Now button */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.45 }}>
              <motion.button
                type="submit" disabled={loading}
                whileHover={!loading ? { scale: 1.015 } : {}}
                whileTap={!loading ? { scale: 0.985 } : {}}
                style={{ width: "100%", padding: "16px 24px", borderRadius: 12, border: "none", background: loading ? "rgba(0,102,255,0.4)" : "linear-gradient(135deg, #0055ee 0%, #0099ff 50%, #00d4ff 100%)", color: "#ffffff", fontSize: 16, fontWeight: 700, letterSpacing: "0.02em", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: loading ? "none" : "0 4px 24px rgba(0,153,255,0.35), 0 0 48px rgba(0,212,255,0.12)", transition: "box-shadow 0.2s, background 0.2s", position: "relative", overflow: "hidden" }}
              >
                {!loading && <span style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)", animation: "shimmer 2.5s infinite" }} />}
                <span style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 10 }}>
                  {loading ? (
                    <>
                      <svg style={{ width: 20, height: 20, animation: "spin 1s linear infinite" }} fill="none" viewBox="0 0 24 24">
                        <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                        <path style={{ opacity: 0.9 }} fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Analyzing your visa profile...
                    </>
                  ) : (
                    <>
                      Evaluate Now
                      <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </span>
              </motion.button>
            </motion.div>

            <p style={{ textAlign: "center", fontSize: 12, color: "#334155", marginTop: 12 }}>
              Your data is processed in-session only. History is saved locally in your browser. This is not legal advice.
            </p>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        textarea::placeholder { color: #2d3748; }
        input::placeholder { color: #2d3748; }
      `}</style>
    </div>
  );
}
