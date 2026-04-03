"use client";

import { useEffect, useRef, useState } from "react";
import { loadPayPalScript, type PayPalPlan } from "@/lib/paypal";

interface PayPalButtonProps {
  plan: PayPalPlan;
  onSuccess: (orderId: string) => void;
  onError: (msg: string) => void;
  onCancel?: () => void;
}

export default function PayPalButton({ plan, onSuccess, onError, onCancel }: PayPalButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const buttonsRef = useRef<{ close: () => void } | null>(null);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId) {
      setStatus("error");
      onError("PayPal client ID not configured.");
      return;
    }

    let mounted = true;

    loadPayPalScript(clientId).then((loaded) => {
      if (!mounted || !containerRef.current || !window.paypal) {
        if (mounted) setStatus("error");
        return;
      }
      if (!loaded) {
        setStatus("error");
        onError("Failed to load PayPal SDK. Check your connection.");
        return;
      }

      // Clear container before rendering (avoid duplicate buttons on re-mount)
      containerRef.current.innerHTML = "";

      const buttons = window.paypal.Buttons({
        style: {
          layout: "vertical",
          color: "black",   // black fits dark theme best
          shape: "rect",
          label: "pay",
          height: 44,
          tagline: false,
        },

        async createOrder() {
          const res = await fetch("/api/paypal/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ plan }),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Order creation failed.");
          }
          const data = await res.json();
          return data.id as string;
        },

        async onApprove(data) {
          const res = await fetch("/api/paypal/capture-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderID: data.orderID }),
          });
          if (!res.ok) {
            const err = await res.json();
            onError(err.error || "Payment capture failed.");
            return;
          }
          const capture = await res.json();
          if (capture.status === "COMPLETED") {
            onSuccess(capture.orderID);
          } else {
            onError("Payment was not completed. Please try again.");
          }
        },

        onError(err) {
          console.error("PayPal error:", err);
          onError("Payment failed. Please try again.");
        },

        onCancel() {
          onCancel?.();
        },
      });

      if (!buttons.isEligible()) {
        setStatus("error");
        onError("PayPal is not available in your region.");
        return;
      }

      buttons.render(containerRef.current!).then(() => {
        if (mounted) setStatus("ready");
      });

      buttonsRef.current = buttons;
    });

    return () => {
      mounted = false;
      try { buttonsRef.current?.close(); } catch { /* ignore */ }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  return (
    <div style={{ width: "100%" }}>
      {status === "loading" && (
        <div
          style={{
            height: 44,
            borderRadius: 8,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            color: "rgba(100,116,139,0.7)",
            fontSize: 13,
          }}
        >
          <svg style={{ width: 15, height: 15, animation: "spin 1s linear infinite" }} fill="none" viewBox="0 0 24 24">
            <circle style={{ opacity: 0.2 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path style={{ opacity: 0.8 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading PayPal…
        </div>
      )}
      {status === "error" && (
        <div
          style={{
            height: 44,
            borderRadius: 8,
            background: "rgba(239,68,68,0.07)",
            border: "1px solid rgba(239,68,68,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(252,165,165,0.8)",
            fontSize: 12,
          }}
        >
          PayPal unavailable
        </div>
      )}
      <div ref={containerRef} style={{ display: status === "ready" ? "block" : "none", width: "100%" }} />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
