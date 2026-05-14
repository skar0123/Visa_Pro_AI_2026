"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PaymentSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Razorpay handles payment confirmation inline; this page is a fallback.
    setTimeout(() => router.replace("/dashboard"), 1800);
  }, [router]);

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
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
        ✓
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Payment Successful!</h2>
      <p style={{ fontSize: 15, color: "#94a3b8", margin: 0 }}>
        Your account has been upgraded. Redirecting to dashboard…
      </p>
    </div>
  );
}
