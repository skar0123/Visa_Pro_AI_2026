"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

const ERROR_MESSAGES: Record<string, string> = {
  oauth_failed:          "Google sign-in was cancelled or failed.",
  state_mismatch:        "Session expired. Please try again.",
  invalid_state:         "Invalid request. Please try again.",
  token_failed:          "Failed to authenticate with Google.",
  user_info_failed:      "Could not retrieve account info from Google.",
  not_authorized:        "This Google account is not authorised for admin access.",
  oauth_not_configured:  "Google OAuth is not configured on this server.",
};

// Shown while Suspense resolves — prevents blank page flash during SSR
function LoadingShell() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#08090f", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spinner />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function AdminLoginInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const step       = searchParams.get("step");
  const token      = searchParams.get("token") ?? "";
  const errorParam = searchParams.get("error");

  const [mounted,   setMounted]   = useState(false);
  const [password,  setPassword]  = useState("");
  const [loading,   setLoading]   = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => { setMounted(true); }, []);

  // Don't render dynamic content until client has mounted (prevents hydration mismatch)
  if (!mounted) return <LoadingShell />;

  const isPasswordStep = step === "password" && token.length > 0;

  // Step 1 — send user to Google OAuth
  function handleGoogleLogin() {
    setLoading(true);
    window.location.href = "/api/auth/admin/google";
  }

  // Step 2 — verify admin password against intermediate token
  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || !token) return;
    setLoading(true);
    setFormError("");

    try {
      const res  = await fetch("/api/admin/verify-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ password, token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "Verification failed.");
        setLoading(false);
      } else {
        router.replace("/admin");
      }
    } catch {
      setFormError("Network error. Please try again.");
      setLoading(false);
    }
  }

  const displayError = formError || (errorParam ? (ERROR_MESSAGES[errorParam] ?? "Something went wrong. Please try again.") : "");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#08090f", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui, sans-serif" }}>
      {/* Ambient glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 600, height: 400, background: "radial-gradient(ellipse, rgba(0,212,255,0.05) 0%, transparent 65%)" }} />
      </div>

      <motion.div
        key={isPasswordStep ? "step2" : "step1"}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 420, borderRadius: 20, background: "#0d1017", border: "1px solid rgba(0,212,255,0.15)", padding: "40px 32px", boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 999, background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", color: "#00d4ff", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 18 }}>
            🔐 Admin
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#ffffff", margin: "0 0 6px" }}>
            {isPasswordStep ? "Verify Password" : "Admin Login"}
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.6 }}>
            {isPasswordStep
              ? "Google identity verified. Enter your admin password to proceed."
              : "Sign in with your designated admin Google account."}
          </p>
        </div>

        {/* Step progress indicators */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 24 }}>
          {["Google OAuth", "Password"].map((label, i) => {
            const isActive = i === 0 ? !isPasswordStep : isPasswordStep;
            const isDone   = i === 0 && isPasswordStep;
            return (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {i > 0 && (
                  <div style={{ width: 28, height: 1, background: isPasswordStep ? "rgba(0,212,255,0.35)" : "rgba(255,255,255,0.08)" }} />
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 700,
                    border: `1px solid ${isDone ? "rgba(16,185,129,0.5)" : isActive ? "rgba(0,212,255,0.5)" : "rgba(255,255,255,0.12)"}`,
                    background: isDone ? "rgba(16,185,129,0.14)" : isActive ? "rgba(0,212,255,0.12)" : "transparent",
                    color: isDone ? "#10b981" : isActive ? "#00d4ff" : "#475569",
                  }}>
                    {isDone ? "✓" : i + 1}
                  </div>
                  <span style={{ fontSize: 12, color: isActive || isDone ? "#e2e8f0" : "#475569", fontWeight: isActive ? 600 : 400 }}>
                    {label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Error banner */}
        {displayError && (
          <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5", fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
            {displayError}
          </div>
        )}

        {/* ── Step 1: Login with Google ── */}
        {!isPasswordStep && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{ width: "100%", padding: "14px 20px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.14)", background: loading ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.07)", color: "#ffffff", fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, transition: "background 0.2s" }}
          >
            {loading ? (
              <><Spinner />Redirecting…</>
            ) : (
              <><GoogleIcon />Login with Google</>
            )}
          </motion.button>
        )}

        {/* ── Step 2: Password verification ── */}
        {isPasswordStep && (
          <form onSubmit={handlePasswordSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFormError(""); }}
                placeholder="Enter admin password"
                autoFocus
                required
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "#070a10", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" as const }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: loading || !password ? "rgba(0,102,255,0.3)" : "linear-gradient(135deg, #0055ee, #0099ff)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              {loading ? <><Spinner />Verifying…</> : "Access Admin Panel →"}
            </button>

            <button
              type="button"
              onClick={() => router.replace("/admin-login")}
              style={{ width: "100%", marginTop: 10, padding: "10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", background: "transparent", color: "#64748b", fontSize: 13, cursor: "pointer" }}
            >
              ← Use a different Google account
            </button>
          </form>
        )}

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <a href="/" style={{ fontSize: 12, color: "#475569", textDecoration: "none" }}>
            ← Back to Home
          </a>
        </div>
      </motion.div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function Spinner() {
  return (
    <svg style={{ width: 16, height: 16, animation: "spin 1s linear infinite", flexShrink: 0 }} fill="none" viewBox="0 0 24 24">
      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
      <path style={{ opacity: 0.85 }} fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<LoadingShell />}>
      <AdminLoginInner />
    </Suspense>
  );
}
