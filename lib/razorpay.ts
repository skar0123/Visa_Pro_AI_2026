declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string; backdrop_color?: string };
  modal?: { ondismiss?: () => void; backdropclose?: boolean };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open(): void;
  close(): void;
}

const SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);

    const existing = document.querySelector(`script[src="${SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export interface InitiatePaymentOptions {
  plan: "pro" | "premium" | "full_report";
  email?: string;
  name?: string;
  onSuccess: (plan: string, paymentId: string) => void;
  onError: (message: string) => void;
  onDismiss?: () => void;
}

export async function initiatePayment({
  plan,
  email,
  name,
  onSuccess,
  onError,
  onDismiss,
}: InitiatePaymentOptions): Promise<void> {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (!keyId) {
    onError("Payment system not configured. Please contact support.");
    return;
  }

  const loaded = await loadRazorpayScript();
  if (!loaded) {
    onError("Failed to load payment system. Check your connection and try again.");
    return;
  }

  let orderData: { order_id: string; amount: number; currency: string };
  try {
    const res = await fetch("/api/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, email: email || "" }),
    });

    if (!res.ok) {
      const err = await res.json();
      onError(err.error || "Failed to create payment order.");
      return;
    }

    orderData = await res.json();
  } catch {
    onError("Network error. Please try again.");
    return;
  }

  const planLabel =
    plan === "pro"         ? "Pro Plan"    :
    plan === "premium"     ? "Prime Plan"  :
                             "Full Report";

  const rzp = new window.Razorpay({
    key:      keyId,
    amount:   orderData.amount,
    currency: orderData.currency,
    name:     "VisaPro AI",
    description: planLabel,
    order_id: orderData.order_id,
    prefill:  { email: email || "", name: name || "" },
    theme: {
      color:          "#00d4ff",
      backdrop_color: "rgba(3,5,15,0.85)",
    },
    modal: {
      ondismiss() { onDismiss?.(); },
      backdropclose: false,
    },
    async handler(response: RazorpayResponse) {
      try {
        const verifyRes = await fetch("/api/razorpay/verify", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id:   response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature:  response.razorpay_signature,
            email: email || "",
            plan,
          }),
        });

        if (!verifyRes.ok) {
          const err = await verifyRes.json();
          onError(err.error || "Payment verification failed. Contact support.");
          return;
        }
      } catch {
        onError("Network error during payment verification. Contact support.");
        return;
      }

      onSuccess(plan, response.razorpay_payment_id);
    },
  });

  rzp.open();
}
