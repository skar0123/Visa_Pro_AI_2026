import type { Plan } from "@/lib/access";

const PLAN_KEY = "visapro_plan";

/** Read the user's current plan from localStorage. Returns "FREE" if unset. */
export function getUserPlan(): Plan {
  if (typeof window === "undefined") return "FREE";
  const stored = localStorage.getItem(PLAN_KEY);
  if (stored === "PRO" || stored === "PREMIUM") return stored;
  return "FREE";
}

/** Persist the user's plan to localStorage (called after successful payment). */
export function setUserPlan(plan: Plan): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PLAN_KEY, plan);
}
