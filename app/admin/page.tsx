"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────
interface User {
  id: string; email: string; name?: string; phone?: string; country?: string;
  role: string; plan: string; usageCount: number;
  createdAt: string; upgradedAt?: string; contacted: boolean;
}
interface Lead {
  id: string; name: string; email: string; phone?: string; country?: string;
  visaCategory?: string; evaluationScore?: number; createdAt: string;
}
interface Payment {
  id: string; provider: string; orderId: string; paymentId?: string;
  plan: string; email: string; amount: number; currency: string;
  status: string; createdAt: string;
}
interface Stats {
  totalUsers: number; freeUsers: number; proUsers: number; premiumUsers: number;
  totalUsage: number; totalLeads: number; totalPayments: number;
  conversionRate: number; revenueINR: number;
  users: User[]; recentLeads: Lead[]; recentPayments: Payment[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(ts: string | null | undefined): string {
  if (!ts) return "—";
  try { return new Date(ts).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }); }
  catch { return ts; }
}
function fmtAmount(amount: number, currency: string): string {
  if (currency === "INR" || currency === "inr")
    return `₹${(amount / 100).toLocaleString("en-IN")}`;
  return `$${(amount / 100).toFixed(2)}`;
}
function planBadge(plan: string) {
  const m: Record<string, { color: string; bg: string; border: string }> = {
    free:    { color: "#64748b", bg: "rgba(100,116,139,0.1)", border: "rgba(100,116,139,0.25)" },
    pro:     { color: "#00d4ff", bg: "rgba(0,212,255,0.1)",  border: "rgba(0,212,255,0.25)"  },
    premium: { color: "#a78bfa", bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.25)" },
  };
  const s = m[plan] ?? m.free;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
      color: s.color, background: s.bg, border: `1px solid ${s.border}`,
      textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
      {plan}
    </span>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KPI({ label, value, sub, icon, color }: {
  label: string; value: string | number; sub: string; icon: string; color: string;
}) {
  return (
    <div style={{ borderRadius: 14, border: `1px solid ${color}20`, backgroundColor: "#0d1017",
      padding: "20px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#475569" }}>{sub}</div>
    </div>
  );
}

// ─── Search + Filter bar ──────────────────────────────────────────────────────
function FilterBar({ search, setSearch, planFilter, setPlanFilter, onExport, exportLabel }: {
  search: string; setSearch: (v: string) => void;
  planFilter: string; setPlanFilter: (v: string) => void;
  onExport: () => void; exportLabel: string;
}) {
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
      <input
        type="text" placeholder="Search email or name…" value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ flex: 1, minWidth: 200, padding: "9px 14px", borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)",
          color: "#e2e8f0", fontSize: 13, outline: "none" }}
      />
      <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}
        style={{ padding: "9px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
          background: "#0d1017", color: "#e2e8f0", fontSize: 13, cursor: "pointer" }}>
        <option value="">All plans</option>
        <option value="free">Free</option>
        <option value="pro">Pro</option>
        <option value="premium">Premium</option>
      </select>
      <button onClick={onExport}
        style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid rgba(16,185,129,0.3)",
          background: "rgba(16,185,129,0.07)", color: "#10b981", fontSize: 13,
          fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
        ↓ {exportLabel}
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats]         = useState<Stats | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [tab, setTab]             = useState<"users" | "leads" | "payments">("users");
  const [acting, setActing]       = useState<string | null>(null);

  // filter state
  const [search, setSearch]       = useState("");
  const [planFilter, setPlan]     = useState("");
  const [debouncedSearch, setDeb] = useState("");

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setDeb(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchStats = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (planFilter) params.set("plan", planFilter);
      const res = await fetch(`/api/admin/stats?${params}`);
      if (res.status === 401) { router.replace("/admin-login"); return; }
      if (!res.ok) throw new Error("Failed to load stats.");
      setStats(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  }, [router, debouncedSearch, planFilter]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  async function upgradeUser(email: string, plan: "pro" | "premium") {
    setActing(`upgrade:${email}`);
    await fetch("/api/admin/users/upgrade", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, plan }),
    });
    await fetchStats(); setActing(null);
  }

  async function deleteUser(email: string) {
    if (!confirm(`Delete ${email}? Cannot be undone.`)) return;
    setActing(`delete:${email}`);
    await fetch("/api/admin/users/delete", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    await fetchStats(); setActing(null);
  }

  async function toggleContact(email: string, current: boolean) {
    setActing(`contact:${email}`);
    await fetch("/api/admin/users/contact", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, contacted: !current }),
    });
    await fetchStats(); setActing(null);
  }

  function exportCSV() {
    const params = new URLSearchParams({ type: tab });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (planFilter) params.set("plan", planFilter);
    window.location.href = `/api/admin/export?${params}`;
  }

  const card: React.CSSProperties = {
    borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)",
    backgroundColor: "#0d1017", padding: "22px",
  };

  // ── Loading/error states ───────────────────────────────────────────────────
  if (loading && !stats) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#08090f", display: "flex",
        alignItems: "center", justifyContent: "center" }}>
        <svg style={{ width: 40, height: 40, animation: "spin 1s linear infinite" }} fill="none" viewBox="0 0 24 24">
          <circle style={{ opacity: 0.2 }} cx="12" cy="12" r="10" stroke="#00d4ff" strokeWidth="4" />
          <path style={{ opacity: 0.9 }} fill="#00d4ff" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#08090f", display: "flex",
        alignItems: "center", justifyContent: "center", color: "#fca5a5", fontFamily: "system-ui" }}>
        {error}
      </div>
    );
  }

  const TABS: { key: "users" | "leads" | "payments"; label: string }[] = [
    { key: "users",    label: `Users (${stats?.users?.length ?? 0})` },
    { key: "leads",    label: `Leads (${stats?.totalLeads ?? 0})`    },
    { key: "payments", label: `Payments (${stats?.totalPayments ?? 0})` },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#08090f", color: "#fff" }}>
      <Navbar />
      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "88px 24px 80px" }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#00d4ff",
              letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>Admin Panel</p>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>VisaPro AI Dashboard</h1>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={fetchStats} disabled={loading}
              style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid rgba(0,212,255,0.25)",
                background: "rgba(0,212,255,0.06)", color: "#00d4ff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {loading ? "…" : "↻ Refresh"}
            </button>
            <button onClick={async () => { await fetch("/api/admin/logout", { method: "POST" }); router.replace("/admin-login"); }}
              style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
                background: "transparent", color: "#64748b", fontSize: 13, cursor: "pointer" }}>
              Log out
            </button>
          </div>
        </motion.div>

        {stats && (
          <>
            {/* KPI Grid */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                gap: 12, marginBottom: 28 }}>
              <KPI label="Total Users"    value={stats.totalUsers}  sub="Registered"     icon="👥" color="#00d4ff" />
              <KPI label="Free Users"     value={stats.freeUsers}   sub="On free plan"   icon="🆓" color="#64748b" />
              <KPI label="Pro Users"      value={stats.proUsers}    sub="Pro plan"       icon="⚡" color="#00d4ff" />
              <KPI label="Premium Users"  value={stats.premiumUsers} sub="Prime plan"    icon="⭐" color="#a78bfa" />
              <KPI label="Total Evals"    value={stats.totalUsage}  sub="All-time"       icon="📊" color="#a78bfa" />
              <KPI label="Total Leads"    value={stats.totalLeads}  sub="Submissions"    icon="📥" color="#f59e0b" />
              <KPI label="Payments"       value={stats.totalPayments} sub="Captured"     icon="💳" color="#10b981" />
              <KPI label="Conversion"     value={`${stats.conversionRate}%`} sub="Free → Paid" icon="📈"
                color={stats.conversionRate >= 10 ? "#10b981" : "#f59e0b"} />
              <KPI label="Revenue (INR)"
                value={`₹${Math.round(stats.revenueINR / 100).toLocaleString("en-IN")}`}
                sub="Total captured" icon="💰" color="#f59e0b" />
            </motion.div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 2, marginBottom: 0,
              borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              {TABS.map((t) => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  style={{ padding: "11px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                    border: "none", borderBottom: `2px solid ${tab === t.key ? "#00d4ff" : "transparent"}`,
                    background: tab === t.key ? "rgba(0,212,255,0.06)" : "transparent",
                    color: tab === t.key ? "#00d4ff" : "rgba(148,163,184,0.6)",
                    transition: "all 0.18s" }}>
                  {t.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">

              {/* ── Users ── */}
              {tab === "users" && (
                <motion.div key="users" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                  style={{ ...card, borderTopLeftRadius: 0, marginTop: 0 }}>
                  <FilterBar search={search} setSearch={setSearch}
                    planFilter={planFilter} setPlanFilter={setPlan}
                    onExport={exportCSV} exportLabel="Export Users CSV" />
                  {!stats.users?.length ? (
                    <p style={{ color: "#475569", fontSize: 13 }}>No users match your filters.</p>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                          <tr>
                            {["Email","Name","Phone","Country","Role","Plan","Usage","Contacted","Joined","Actions"].map((h) => (
                              <th key={h} style={{ textAlign: "left", padding: "8px 10px",
                                color: "#64748b", fontSize: 11, fontWeight: 600, textTransform: "uppercase",
                                letterSpacing: "0.05em", borderBottom: "1px solid rgba(255,255,255,0.06)",
                                whiteSpace: "nowrap" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {stats.users.map((u) => {
                            const busy = acting?.includes(u.email);
                            return (
                              <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                <td style={{ padding: "9px 10px", color: "#94a3b8", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</td>
                                <td style={{ padding: "9px 10px", color: "#cbd5e1" }}>{u.name ?? "—"}</td>
                                <td style={{ padding: "9px 10px", color: "#64748b" }}>{u.phone ?? "—"}</td>
                                <td style={{ padding: "9px 10px", color: "#64748b" }}>{u.country ?? "—"}</td>
                                <td style={{ padding: "9px 10px" }}>
                                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                                    color: u.role === "admin" ? "#f59e0b" : "#64748b",
                                    background: u.role === "admin" ? "rgba(245,158,11,0.1)" : "rgba(100,116,139,0.1)",
                                    border: u.role === "admin" ? "1px solid rgba(245,158,11,0.3)" : "1px solid rgba(100,116,139,0.2)",
                                    textTransform: "uppercase" }}>
                                    {u.role}
                                  </span>
                                </td>
                                <td style={{ padding: "9px 10px" }}>{planBadge(u.plan)}</td>
                                <td style={{ padding: "9px 10px", color: "#e2e8f0", fontWeight: 600, textAlign: "center" }}>{u.usageCount}</td>
                                <td style={{ padding: "9px 10px", textAlign: "center" }}>
                                  <button onClick={() => toggleContact(u.email, u.contacted)} disabled={!!busy}
                                    style={{ padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 600,
                                      cursor: "pointer",
                                      color:  u.contacted ? "#10b981" : "#64748b",
                                      background: u.contacted ? "rgba(16,185,129,0.1)" : "transparent",
                                      border: `1px solid ${u.contacted ? "rgba(16,185,129,0.35)" : "rgba(100,116,139,0.25)"}` }}>
                                    {u.contacted ? "✓ Done" : "Mark"}
                                  </button>
                                </td>
                                <td style={{ padding: "9px 10px", color: "#64748b", whiteSpace: "nowrap" }}>{fmtDate(u.createdAt)}</td>
                                <td style={{ padding: "9px 10px" }}>
                                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                                    {u.plan === "free" && (
                                      <button onClick={() => upgradeUser(u.email, "pro")} disabled={!!busy}
                                        style={{ padding: "3px 8px", borderRadius: 5, border: "1px solid rgba(0,212,255,0.3)",
                                          background: "rgba(0,212,255,0.08)", color: "#00d4ff", fontSize: 10,
                                          fontWeight: 600, cursor: busy ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
                                        {acting === `upgrade:${u.email}` ? "…" : "→ Pro"}
                                      </button>
                                    )}
                                    {u.plan !== "premium" && (
                                      <button onClick={() => upgradeUser(u.email, "premium")} disabled={!!busy}
                                        style={{ padding: "3px 8px", borderRadius: 5, border: "1px solid rgba(167,139,250,0.3)",
                                          background: "rgba(167,139,250,0.08)", color: "#a78bfa", fontSize: 10,
                                          fontWeight: 600, cursor: busy ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
                                        {acting === `upgrade:${u.email}` ? "…" : "→ Prime"}
                                      </button>
                                    )}
                                    <button onClick={() => deleteUser(u.email)} disabled={!!busy}
                                      style={{ padding: "3px 8px", borderRadius: 5, border: "1px solid rgba(239,68,68,0.3)",
                                        background: "rgba(239,68,68,0.08)", color: "#f87171", fontSize: 10,
                                        fontWeight: 600, cursor: busy ? "not-allowed" : "pointer" }}>
                                      {acting === `delete:${u.email}` ? "…" : "Delete"}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── Leads ── */}
              {tab === "leads" && (
                <motion.div key="leads" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                  style={{ ...card, borderTopLeftRadius: 0, marginTop: 0 }}>
                  <FilterBar search={search} setSearch={setSearch}
                    planFilter={planFilter} setPlanFilter={setPlan}
                    onExport={exportCSV} exportLabel="Export Leads CSV" />
                  {!stats.recentLeads.length ? (
                    <p style={{ color: "#475569", fontSize: 13 }}>No leads yet.</p>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                          <tr>
                            {["Name","Email","Phone","Country","Visa","Score","Date"].map((h) => (
                              <th key={h} style={{ textAlign: "left", padding: "8px 10px",
                                color: "#64748b", fontSize: 11, fontWeight: 600, textTransform: "uppercase",
                                letterSpacing: "0.05em", borderBottom: "1px solid rgba(255,255,255,0.06)",
                                whiteSpace: "nowrap" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {stats.recentLeads.map((l) => (
                            <tr key={l.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                              <td style={{ padding: "9px 10px", color: "#e2e8f0", fontWeight: 500 }}>{l.name}</td>
                              <td style={{ padding: "9px 10px", color: "#94a3b8" }}>{l.email}</td>
                              <td style={{ padding: "9px 10px", color: "#64748b" }}>{l.phone ?? "—"}</td>
                              <td style={{ padding: "9px 10px", color: "#64748b" }}>{l.country ?? "—"}</td>
                              <td style={{ padding: "9px 10px", color: "#64748b" }}>{l.visaCategory ?? "—"}</td>
                              <td style={{ padding: "9px 10px" }}>
                                {l.evaluationScore != null ? (
                                  <span style={{
                                    fontWeight: 700,
                                    color: l.evaluationScore >= 75 ? "#10b981" : l.evaluationScore >= 55 ? "#00d4ff" : l.evaluationScore >= 35 ? "#f59e0b" : "#ef4444",
                                  }}>{l.evaluationScore}</span>
                                ) : "—"}
                              </td>
                              <td style={{ padding: "9px 10px", color: "#64748b", whiteSpace: "nowrap" }}>{fmtDate(l.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── Payments ── */}
              {tab === "payments" && (
                <motion.div key="payments" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                  style={{ ...card, borderTopLeftRadius: 0, marginTop: 0 }}>
                  <FilterBar search={search} setSearch={setSearch}
                    planFilter={planFilter} setPlanFilter={setPlan}
                    onExport={exportCSV} exportLabel="Export Payments CSV" />
                  {!stats.recentPayments.length ? (
                    <p style={{ color: "#475569", fontSize: 13 }}>No payments recorded yet.</p>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                          <tr>
                            {["Provider","Plan","Email","Amount","Order ID","Payment ID","Status","Date"].map((h) => (
                              <th key={h} style={{ textAlign: "left", padding: "8px 10px",
                                color: "#64748b", fontSize: 11, fontWeight: 600, textTransform: "uppercase",
                                letterSpacing: "0.05em", borderBottom: "1px solid rgba(255,255,255,0.06)",
                                whiteSpace: "nowrap" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {stats.recentPayments.map((p) => (
                            <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                              <td style={{ padding: "9px 10px" }}>
                                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5,
                                  color: "#00d4ff", background: "rgba(0,212,255,0.1)",
                                  border: "1px solid rgba(0,212,255,0.25)", textTransform: "uppercase" }}>
                                  {p.provider}
                                </span>
                              </td>
                              <td style={{ padding: "9px 10px" }}>{planBadge(p.plan)}</td>
                              <td style={{ padding: "9px 10px", color: "#94a3b8" }}>{p.email}</td>
                              <td style={{ padding: "9px 10px", color: "#10b981", fontWeight: 700 }}>
                                {fmtAmount(p.amount, p.currency)}
                              </td>
                              <td style={{ padding: "9px 10px", color: "#475569", fontSize: 11,
                                maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {p.orderId}
                              </td>
                              <td style={{ padding: "9px 10px", color: "#475569", fontSize: 11,
                                maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {p.paymentId ?? "—"}
                              </td>
                              <td style={{ padding: "9px 10px" }}>
                                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5,
                                  color: p.status === "captured" ? "#10b981" : "#f59e0b",
                                  background: p.status === "captured" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                                  border: `1px solid ${p.status === "captured" ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)"}`,
                                  textTransform: "uppercase" }}>
                                  {p.status}
                                </span>
                              </td>
                              <td style={{ padding: "9px 10px", color: "#64748b", whiteSpace: "nowrap" }}>{fmtDate(p.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
