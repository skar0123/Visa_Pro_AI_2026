// PayPal JS SDK loader + type declarations

export type PayPalPlan = "pro" | "premium";

// ── Minimal PayPal SDK types ──────────────────────────────────────────────────
interface PayPalButtonStyle {
  layout?: "vertical" | "horizontal";
  color?: "gold" | "blue" | "silver" | "white" | "black";
  shape?: "rect" | "pill";
  label?: "paypal" | "checkout" | "pay" | "buynow";
  height?: number;
  tagline?: boolean;
}

interface PayPalOrderActions {
  order: {
    create: (data: Record<string, unknown>) => Promise<string>;
    capture: () => Promise<Record<string, unknown>>;
  };
}

interface PayPalApproveData {
  orderID: string;
  payerID?: string;
}

interface PayPalButtonsConfig {
  style?: PayPalButtonStyle;
  createOrder: (_: unknown, actions: PayPalOrderActions) => Promise<string>;
  onApprove: (data: PayPalApproveData, actions: PayPalOrderActions) => Promise<void>;
  onError?: (err: unknown) => void;
  onCancel?: () => void;
}

interface PayPalButtons {
  render: (container: HTMLElement | string) => Promise<void>;
  close: () => void;
  isEligible: () => boolean;
}

export interface PayPalNamespace {
  Buttons: (config: PayPalButtonsConfig) => PayPalButtons;
}

declare global {
  interface Window {
    paypal?: PayPalNamespace;
  }
}

// ── Script loader ─────────────────────────────────────────────────────────────
const SCRIPT_ID = "paypal-sdk";

export function loadPayPalScript(clientId: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.paypal) return resolve(true);

    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener("load", () => resolve(!!window.paypal));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture`;
    script.async = true;
    script.onload = () => resolve(!!window.paypal);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ── Plan amounts ──────────────────────────────────────────────────────────────
export const PAYPAL_AMOUNTS: Record<PayPalPlan, string> = {
  pro: "29.00",
  premium: "99.00",
};
