// Single source of truth for all plan pricing.
// Update here — backend routes and UI both import from this file.

export const PRICING = {
  PRO:     { INR: 4999, USD: 60  },
  PREMIUM: { INR: 8999, USD: 108 },
} as const;

export type PaidPlanId = "pro" | "premium";

// Razorpay expects amounts in paise (INR × 100)
export const RAZORPAY_AMOUNTS: Record<PaidPlanId, number> = {
  pro:     PRICING.PRO.INR     * 100, // 499900
  premium: PRICING.PREMIUM.INR * 100, // 899900
};

// PayPal expects amounts as decimal USD strings
export const PAYPAL_AMOUNTS: Record<PaidPlanId, string> = {
  pro:     PRICING.PRO.USD.toFixed(2),     // "60.00"
  premium: PRICING.PREMIUM.USD.toFixed(2), // "108.00"
};
