"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Suspense } from "react";

const ERROR_MESSAGES: Record<string, string> = {
  oauth_failed:          "Google sign-in was cancelled or failed.",
  state_mismatch:        "Session expired. Please try again.",
  invalid_state:         "Invalid request. Please try again.",
  token_failed:          "Failed to authenticate with Google. Please try again.",
  user_info_failed:      "Failed to retrieve your account info. Please try again.",
  oauth_not_configured:  "Google login is not available right now.",
};

function LoginInner() {
  const searchParams = useSearchParams();
  const plan         = searchParams.get("plan") ?? "free";
  const returnTo     = searchParams.get("returnTo") ?? "/dashboard";
  const error        = searchParams.get("error");

  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  // If user already has a session, redirect them
  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) {
          window.location.href = returnTo.startsWith("/") ? returnTo : "/dashboard";
        } else {
          setChecked(true);
        }
      })
      .catch(() => setChecked(true));
  }, [returnTo]);

  function handleGoogleLogin() {
    setLoading(true);
    const url = `/api/auth/google?plan=${encodeURIComponent(plan)}&returnTo=${encodeURIComponent(returnTo)}`;
    window.location.href = url;
  }

  const planLabels: Record<string, string> = {
    free:    "Start Free",
    pro:     "Upgrade to Pro",
    premium: "Get Prime",
  };

  const planColors: Record<string, string> = {
    free:    "rgba(100,116,139,0.8)",
    pro:     "#00d4ff",
    premium: "#a78bfa",
  };

  const accentColor = planColors[plan] ?? "#00d4ff";

  if (!checked) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#08090f", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg style={{ width: 36, height: 36, animation: "spin 1s linear infinite" }} fill="none" viewBox="0 0 24 24">
          <circle style={{ opacity: 0.2 }} cx="12" cy="12" r="10" stroke="#00d4ff" strokeWidth="4" />
          <path style={{ opacity: 0.9 }} fill="#00d4ff" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#08090f",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Background glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 700, height: 400, background: "radial-gradient(ellipse, rgba(0,102,255,0.07) 0%, transparent 65%)" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 420,
          borderRadius: 20,
          background: "#0d1017",
          border: `1px solid ${accentColor}30`,
          padding: "40px 32px",
          boxShadow: `0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px ${accentColor}10`,
        }}
      >
        {/* Logo/brand */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 12px", borderRadius: 999, background: `${accentColor}10`, border: `1px solid ${accentColor}25`, color: accentColor, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>
            VisaPro AI
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#ffffff", margin: "0 0 8px" }}>
            {plan !== "free" ? planLabels[plan] ?? "Sign In" : "Sign In to Continue"}
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0, lineHeight: 1.6 }}>
            {plan === "free"
              ? "Sign in to start your free visa evaluation."
              : plan === "pro"
              ? "Sign in to complete your Pro plan purchase."
              : "Sign in to complete your Prime plan purchase."}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5", fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
            {ERROR_MESSAGES[error] ?? "Something went wrong. Please try again."}
          </div>
        )}

        {/* Google button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px 20px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.14)",
            background: loading ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.06)",
            color: "#ffffff",
            fontSize: 15,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            transition: "background 0.2s, border-color 0.2s",
          }}
        >
          {loading ? (
            <>
              <svg style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} fill="none" viewBox="0 0 24 24">
                <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                <path style={{ opacity: 0.85 }} fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Redirecting…
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continue with Google
            </>
          )}
        </motion.button>

        <p style={{ textAlign: "center", fontSize: 12, color: "#334155", marginTop: 20, lineHeight: 1.6 }}>
          By signing in you agree to our terms of service.
          Your data is processed securely.
        </p>

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
          <a href="/" style={{ fontSize: 13, color: "#64748b", textDecoration: "none" }}>
            ← Back to Home
          </a>
        </div>
      </motion.div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
