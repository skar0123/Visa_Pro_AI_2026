import { appendFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

export interface LeadData {
  name: string;
  email: string;
  visaPreference?: string;
  score: number;
  timestamp: string;
}

export interface PaymentEvent {
  provider: "razorpay" | "stripe";
  email: string;
  amount: number;
  currency: string;
  timestamp: string;
}

// ── Persistent storage paths ──────────────────────────────────────────────────
const DATA_DIR =
  process.env.LEADS_DATA_DIR ||
  (process.env.NODE_ENV === "production" ? "/tmp" : join(process.cwd(), "data"));

const LEADS_FILE = join(DATA_DIR, "visapro_leads.jsonl");
const PAYMENTS_FILE = join(DATA_DIR, "visapro_payments.jsonl");

// ── In-memory stores (module-scoped, survive warm restarts) ───────────────────
const leadsMap = new Map<string, LeadData>();    // keyed by email
const paymentsMap = new Map<string, PaymentEvent>(); // keyed by email

let initialized = false;

function ensureDataDir(): void {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  } catch { /* ignore */ }
}

function loadFromDisk(): void {
  if (initialized) return;
  initialized = true;
  ensureDataDir();

  try {
    if (existsSync(LEADS_FILE)) {
      readFileSync(LEADS_FILE, "utf8")
        .split("\n")
        .filter(Boolean)
        .forEach((line) => {
          try {
            const lead: LeadData = JSON.parse(line);
            if (lead.email) leadsMap.set(lead.email.toLowerCase(), lead);
          } catch { /* skip malformed line */ }
        });
    }
  } catch { /* ignore read errors */ }

  try {
    if (existsSync(PAYMENTS_FILE)) {
      readFileSync(PAYMENTS_FILE, "utf8")
        .split("\n")
        .filter(Boolean)
        .forEach((line) => {
          try {
            const event: PaymentEvent = JSON.parse(line);
            if (event.email) paymentsMap.set(event.email.toLowerCase(), event);
          } catch { /* skip malformed line */ }
        });
    }
  } catch { /* ignore read errors */ }
}

function appendToFile(path: string, obj: object): void {
  try {
    ensureDataDir();
    appendFileSync(path, JSON.stringify(obj) + "\n", "utf8");
  } catch { /* non-blocking — never fail the main request */ }
}

// ── Deduplication ─────────────────────────────────────────────────────────────
const DEDUPE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const recentSubmissions = new Map<string, number>();

function isDuplicate(email: string): boolean {
  const last = recentSubmissions.get(email);
  return !!last && Date.now() - last < DEDUPE_WINDOW_MS;
}

function markSeen(email: string): void {
  recentSubmissions.set(email, Date.now());
  if (recentSubmissions.size > 1000) {
    const cutoff = Date.now() - DEDUPE_WINDOW_MS;
    for (const [k, v] of recentSubmissions) {
      if (v < cutoff) recentSubmissions.delete(k);
    }
  }
}

// ── Webhook with retry ────────────────────────────────────────────────────────
async function webhookWithRetry(payload: object, attempt = 1): Promise<void> {
  const url = process.env.LEAD_WEBHOOK_URL || process.env.WEBHOOK_URL;
  if (!url) return;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, attempt * 1500));
      return webhookWithRetry(payload, attempt + 1);
    }
    console.error("[lead] webhook failed after 3 attempts:", err);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export async function captureLead(
  lead: LeadData
): Promise<{ ok: boolean; duplicate: boolean }> {
  loadFromDisk();

  const email = lead.email.toLowerCase().trim();

  if (isDuplicate(email)) {
    return { ok: false, duplicate: true };
  }
  markSeen(email);

  const normalized: LeadData = { ...lead, email };

  // In-memory store (latest wins per email)
  leadsMap.set(email, normalized);

  // Persist to disk (append-only log)
  appendToFile(LEADS_FILE, normalized);

  // Structured log
  console.log(
    JSON.stringify({
      event: "lead_captured",
      email,
      name: lead.name,
      score: lead.score,
      visaPreference: lead.visaPreference,
      timestamp: lead.timestamp,
    })
  );

  // Non-blocking webhook with retry
  webhookWithRetry(normalized).catch(() => {});

  return { ok: true, duplicate: false };
}

export function trackPayment(event: PaymentEvent): void {
  loadFromDisk();

  const email = event.email.toLowerCase().trim();
  const normalized: PaymentEvent = { ...event, email };

  paymentsMap.set(email, normalized);
  appendToFile(PAYMENTS_FILE, normalized);

  console.log(
    JSON.stringify({
      event: "payment_tracked",
      provider: event.provider,
      email,
      amount: event.amount,
      currency: event.currency,
      timestamp: event.timestamp,
    })
  );

  // Forward payment event to webhook
  webhookWithRetry({ type: "payment", ...normalized }).catch(() => {});
}

export function getAdminStats() {
  loadFromDisk();

  const totalUsers = leadsMap.size;
  const totalPayments = paymentsMap.size;
  const conversionRate =
    totalUsers > 0 ? Math.round((totalPayments / totalUsers) * 100) : 0;

  const recentLeads = [...leadsMap.values()]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 25);

  const recentPayments = [...paymentsMap.values()]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 10);

  return {
    totalUsers,
    totalPayments,
    conversionRate,
    recentLeads,
    recentPayments,
  };
}
