"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SuccessInner() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("session_id");

  const [status, setStatus] = useState<
    "verifying" | "re-evaluating" | "done" | "error"
  >("verifying");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!sessionId) {
      router.replace("/results");
      return;
    }

    (async () => {
      try {
        // Step 1 — verify Stripe session.
        // The response sets an HTTP-only cookie automatically.
        setStatus("verifying");
        const verifyRes = await fetch("/api/payment/stripe/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });

        if (!verifyRes.ok) {
          const d = await verifyRes.json();
          throw new Error(d.error || "Payment verification failed.");
        }

        // Step 2 — re-evaluate with the paid session cookie now in browser.
        setStatus("re-evaluating");
        const inputs = (() => {
          try {
            return JSON.parse(
              localStorage.getItem("visapro_profile_inputs") || "null"
            );
          } catch {
            return null;
          }
        })();

        if (inputs) {
          // Cookie is sent automatically — no Authorization header needed.
          const evalRes = await fetch("/api/evaluate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(inputs),
          });

          if (evalRes.ok) {
            const fullResult = await evalRes.json();
            sessionStorage.setItem(
              "visapro_result",
              JSON.stringify({
                ...fullResult,
                applicantName: inputs.name || "Applicant",
              })
            );
          }
        }

        setStatus("done");
        router.replace("/results");
      } catch (err) {
        setErrorMsg(
          err instanceof Error ? err.message : "Something went wrong."
        );
        setStatus("error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const messages: Record<typeof status, string> = {
    verifying: "Verifying payment…",
    "re-evaluating": "Unlocking your full report…",
    done: "Redirecting to your report…",
    error: errorMsg,
  };

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
      {status !== "error" ? (
        <>
          <svg
            style={{
              width: 48,
              height: 48,
              animation: "spin 1s linear infinite",
            }}
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              style={{ opacity: 0.2 }}
              cx="12"
              cy="12"
              r="10"
              stroke="#00d4ff"
              strokeWidth="4"
            />
            <path
              style={{ opacity: 0.9 }}
              fill="#00d4ff"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p style={{ fontSize: 16, color: "#94a3b8" }}>{messages[status]}</p>
        </>
      ) : (
        <>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
            }}
          >
            ✕
          </div>
          <p
            style={{
              fontSize: 16,
              color: "#fca5a5",
              textAlign: "center",
              maxWidth: 400,
            }}
          >
            {errorMsg}
          </p>
          <button
            onClick={() => router.replace("/results")}
            style={{
              padding: "10px 24px",
              borderRadius: 8,
              border: "1px solid rgba(0,212,255,0.3)",
              background: "rgba(0,212,255,0.08)",
              color: "#00d4ff",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Return to Results
          </button>
        </>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
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
