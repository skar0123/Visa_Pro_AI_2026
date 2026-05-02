"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SuccessInner() {
  const router      = useRouter();
  const params      = useSearchParams();
  const orderId     = params.get("token");     // PayPal sends orderId as "token"
  const [status, setStatus] = useState<"capturing" | "done" | "error">("capturing");
  const [errorMsg,  setErrorMsg]  = useState("");

  useEffect(() => {
    if (!orderId) {
      router.replace("/pricing");
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/paypal/capture-order", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ orderId }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Payment capture failed.");
        }

        setStatus("done");
        // Small delay so the user sees success, then redirect
        setTimeout(() => router.replace("/dashboard"), 1800);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
        setStatus("error");
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#08090f",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        color: "#ffffff",
        fontFamily: "system-ui, sans-serif",
        padding: 24,
      }}
    >
      {status === "capturing" && (
        <>
          <svg style={{ width: 48, height: 48, animation: "spin 1s linear infinite" }} fill="none" viewBox="0 0 24 24">
            <circle style={{ opacity: 0.2 }} cx="12" cy="12" r="10" stroke="#00d4ff" strokeWidth="4" />
            <path style={{ opacity: 0.9 }} fill="#00d4ff" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p style={{ fontSize: 16, color: "#94a3b8" }}>Confirming your payment…</p>
        </>
      )}

      {status === "done" && (
        <>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
            ✓
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Payment Successful!</h2>
          <p style={{ fontSize: 15, color: "#94a3b8", margin: 0 }}>
            Your account has been upgraded. Redirecting to dashboard…
          </p>
        </>
      )}

      {status === "error" && (
        <>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
            ✕
          </div>
          <p style={{ fontSize: 15, color: "#fca5a5", textAlign: "center", maxWidth: 400 }}>
            {errorMsg}
          </p>
          <button
            onClick={() => router.replace("/pricing")}
            style={{ padding: "10px 24px", borderRadius: 8, border: "1px solid rgba(0,212,255,0.3)", background: "rgba(0,212,255,0.08)", color: "#00d4ff", fontSize: 14, cursor: "pointer" }}
          >
            Return to Pricing
          </button>
        </>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense>
      <SuccessInner />
    </Suspense>
  );
}
