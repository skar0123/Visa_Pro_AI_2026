"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";

interface User {
  id: string; email: string; name?: string;
  plan: "free" | "premium"; usage_count: number;
  created_at: string; upgraded_at?: string; contacted?: boolean;
}

interface Lead {
  name: string; email: string; score: number;
  timestamp: string; visaPreference?: string;
}

interface PaymentEvent {
  provider: "paypal" | "razorpay";
  email: string; amount: number; currency: string; timestamp: string;
}

interface Stats {
  totalUsers: number; totalPayments: number; conversionRate: number;
  recentLeads: Lead[]; recentPayments: PaymentEvent[];
  users: User[]; freeUsers: number; premiumUsers: number; totalUsage: number;
}

function formatDate(ts: string): string {
  try { return new Date(ts).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }); }
  catch { return ts; }
}

function formatAmount(amount: number, currency: string): string {
  if (currency === "inr" || currency === "INR") return `₹${(amount / 100).toLocaleString()}`;
  return `$${(amount / 100).toFixed(2)}`;
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats]           = useState<Stats | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [activeTab, setActiveTab]   = useState<"users" | "leads" | "payments">("users");
  const [actionLoading, setAction]  = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/stats");
      if (res.status === 401) { router.replace("/admin-login"); return; }
      if (!res.ok) throw new Error("Failed to load stats.");
      setStats(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  async function upgradeUser(email: string) {
    setAction(`upgrade:${email}`);
    await fetch("/api/admin/users/upgrade", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    await fetchStats();
    setAction(null);
  }

  async function deleteUser(email: string) {
    if (!confirm(`Delete ${email}? This cannot be undone.`)) return;
    setAction(`delete:${email}`);
    await fetch("/api/admin/users/delete", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    await fetchStats();
    setAction(null);
  }

  async function toggleContact(email: string, current: boolean) {
    setAction(`contact:${email}`);
    await fetch("/api/admin/users/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, contacted: !current }) });
    await fetchStats();
    setAction(null);
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin-login");
  }

  function downloadCSV(type: "users" | "leads" | "payments") {
    window.location.href = `/api/admin/export?type=${type}`;
  }

  const card: React.CSSProperties = { borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "#0d1017", padding: "24px" };

  if (loading && !stats) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#08090f", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
      <div style={{ minHeight: "100vh", backgroundColor: "#08090f", display: "flex", alignItems: "center", justifyContent: "center", color: "#fca5a5", fontFamily: "system-ui" }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#08090f", color: "#fff" }}>
      <Navbar />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "88px 24px 80px" }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 12 }}
        >
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#00d4ff", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>Admin Panel</p>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>VisaPro Dashboard</h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => fetchStats()} disabled={loading} style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid rgba(0,212,255,0.25)", background: "rgba(0,212,255,0.06)", color: "#00d4ff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {loading ? "Refreshing…" : "↻ Refresh"}
            </button>
            <button onClick={() => downloadCSV(activeTab)} style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid rgba(16,185,129,0.25)", background: "rgba(16,185,129,0.06)", color: "#10b981", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              ↓ Export CSV
            </button>
            <button onClick={logout} style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#64748b", fontSize: 13, cursor: "pointer" }}>
              Log out
            </button>
          </div>
        </motion.div>

        {stats && (
          <>
            {/* KPI Cards */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginBottom: 28 }}
            >
              {[
                { label: "Total Users",      value: stats.users?.length ?? stats.totalUsers, icon: "👥", color: "#00d4ff",  sub: "Registered" },
                { label: "Free Users",       value: stats.freeUsers ?? 0,                    icon: "🆓", color: "#64748b",  sub: "On free plan" },
                { label: "Premium Users",    value: stats.premiumUsers ?? 0,                 icon: "⭐", color: "#10b981",  sub: "Paid" },
                { label: "Total Evals",      value: stats.totalUsage ?? 0,                   icon: "📊", color: "#a78bfa",  sub: "All-time runs" },
                { label: "Conversion",       value: `${stats.conversionRate}%`,              icon: "📈", color: stats.conversionRate >= 10 ? "#10b981" : "#f59e0b", sub: "Free → Paid" },
                {
                  label: "Revenue Est.", icon: "💰", color: "#f59e0b", sub: "USD",
                  value: (() => {
                    const r = (stats.recentPayments ?? []).reduce((s, p) => {
                      if (p.currency === "inr" || p.currency === "INR") return s + p.amount / 100 / 85;
                      return s + p.amount / 100;
                    }, 0);
                    return `~$${Math.round(r).toLocaleString()}`;
                  })(),
                },
              ].map((kpi, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.08 + i * 0.04 }}
                  style={{ ...card, border: `1px solid ${kpi.color}20` }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 20 }}>{kpi.icon}</span>
                    <span style={{ fontSize: 12, color: "#64748b" }}>{kpi.label}</span>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: kpi.color, lineHeight: 1, marginBottom: 4 }}>{kpi.value}</div>
                  <div style={{ fontSize: 11, color: "#475569" }}>{kpi.sub}</div>
                </motion.div>
              ))}
            </motion.div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {(["users", "leads", "payments"] as const).map((t) => (
                <button key={t} onClick={() => setActiveTab(t)}
                  style={{ padding: "10px 18px", fontSize: 13, fontWeight: 600, border: "none", borderBottom: `2px solid ${activeTab === t ? "#00d4ff" : "transparent"}`, background: activeTab === t ? "rgba(0,212,255,0.05)" : "transparent", color: activeTab === t ? "#00d4ff" : "rgba(148,163,184,0.6)", cursor: "pointer", textTransform: "capitalize", transition: "all 0.2s" }}
                >
                  {t === "users" ? `Users (${stats.users?.length ?? 0})` : t === "leads" ? `Leads (${stats.totalUsers})` : `Payments (${stats.totalPayments})`}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">

              {/* ── Users ── */}
              {activeTab === "users" && (
                <motion.div key="users" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} style={{ ...card }}>
                  <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 18px" }}>All Users</h2>
                  {!stats.users?.length ? (
                    <p style={{ color: "#475569", fontSize: 13 }}>No users yet.</p>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                          <tr>
                            {["Email", "Name", "Plan", "Usage", "Contacted", "Joined", "Actions"].map((h) => (
                              <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#64748b", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid rgba(255,255,255,0.06)", whiteSpace: "nowrap" }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {stats.users.map((user) => {
                            const isActing = actionLoading?.includes(user.email);
                            return (
                              <tr key={user.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                <td style={{ padding: "10px 12px", color: "#94a3b8" }}>{user.email}</td>
                                <td style={{ padding: "10px 12px", color: "#cbd5e1" }}>{user.name ?? "—"}</td>
                                <td style={{ padding: "10px 12px" }}>
                                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, color: user.plan === "premium" ? "#10b981" : "#64748b", background: user.plan === "premium" ? "rgba(16,185,129,0.12)" : "rgba(100,116,139,0.1)", border: `1px solid ${user.plan === "premium" ? "rgba(16,185,129,0.3)" : "rgba(100,116,139,0.2)"}`, textTransform: "uppercase" }}>
                                    {user.plan}
                                  </span>
                                </td>
                                <td style={{ padding: "10px 12px", color: "#e2e8f0", fontWeight: 600, textAlign: "center" }}>{user.usage_count}</td>
                                <td style={{ padding: "10px 12px", textAlign: "center" }}>
                                  <button
                                    onClick={() => toggleContact(user.email, !!user.contacted)}
                                    disabled={!!isActing}
                                    style={{ padding: "3px 10px", borderRadius: 20, border: `1px solid ${user.contacted ? "rgba(16,185,129,0.4)" : "rgba(100,116,139,0.25)"}`, background: user.contacted ? "rgba(16,185,129,0.1)" : "transparent", color: user.contacted ? "#10b981" : "#64748b", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                                  >
                                    {user.contacted ? "✓ Contacted" : "Mark"}
                                  </button>
                                </td>
                                <td style={{ padding: "10px 12px", color: "#64748b", whiteSpace: "nowrap" }}>{formatDate(user.created_at)}</td>
                                <td style={{ padding: "10px 12px" }}>
                                  <div style={{ display: "flex", gap: 6 }}>
                                    {user.plan !== "premium" && (
                                      <button
                                        onClick={() => upgradeUser(user.email)}
                                        disabled={!!isActing}
                                        style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(0,212,255,0.3)", background: "rgba(0,212,255,0.08)", color: "#00d4ff", fontSize: 11, fontWeight: 600, cursor: isActing ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}
                                      >
                                        {actionLoading === `upgrade:${user.email}` ? "…" : "↑ Upgrade"}
                                      </button>
                                    )}
                                    <button
                                      onClick={() => deleteUser(user.email)}
                                      disabled={!!isActing}
                                      style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#f87171", fontSize: 11, fontWeight: 600, cursor: isActing ? "not-allowed" : "pointer" }}
                                    >
                                      {actionLoading === `delete:${user.email}` ? "…" : "Delete"}
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
              {activeTab === "leads" && (
                <motion.div key="leads" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} style={{ ...card }}>
                  <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 18px" }}>Recent Leads</h2>
                  {!stats.recentLeads.length ? (
                    <p style={{ color: "#475569", fontSize: 13 }}>No leads captured yet.</p>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                          <tr>
                            {["Name", "Email", "Score", "Visa Pref.", "Date"].map((h) => (
                              <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#64748b", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid rgba(255,255,255,0.06)", whiteSpace: "nowrap" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {stats.recentLeads.map((lead, i) => (
                            <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                              <td style={{ padding: "10px 12px", color: "#e2e8f0", fontWeight: 500 }}>{lead.name}</td>
                              <td style={{ padding: "10px 12px", color: "#94a3b8" }}>{lead.email}</td>
                              <td style={{ padding: "10px 12px" }}>
                                <span style={{ color: lead.score >= 75 ? "#10b981" : lead.score >= 55 ? "#00d4ff" : lead.score >= 35 ? "#f59e0b" : "#ef4444", fontWeight: 700 }}>{lead.score}</span>
                              </td>
                              <td style={{ padding: "10px 12px", color: "#64748b" }}>{lead.visaPreference ?? "—"}</td>
                              <td style={{ padding: "10px 12px", color: "#64748b", whiteSpace: "nowrap" }}>{formatDate(lead.timestamp)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── Payments ── */}
              {activeTab === "payments" && (
                <motion.div key="payments" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} style={{ ...card }}>
                  <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 18px" }}>Recent Payments</h2>
                  {!stats.recentPayments.length ? (
                    <p style={{ color: "#475569", fontSize: 13 }}>No payments recorded yet.</p>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                          <tr>
                            {["Provider", "Email", "Amount", "Date"].map((h) => (
                              <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#64748b", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid rgba(255,255,255,0.06)", whiteSpace: "nowrap" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {stats.recentPayments.map((payment, i) => (
                            <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                              <td style={{ padding: "10px 12px" }}>
                                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, color: "#0099ff", background: "rgba(0,153,255,0.1)", border: "1px solid rgba(0,153,255,0.25)", textTransform: "uppercase" }}>
                                  {payment.provider}
                                </span>
                              </td>
                              <td style={{ padding: "10px 12px", color: "#94a3b8" }}>{payment.email}</td>
                              <td style={{ padding: "10px 12px", color: "#10b981", fontWeight: 700 }}>{formatAmount(payment.amount, payment.currency)}</td>
                              <td style={{ padding: "10px 12px", color: "#64748b", whiteSpace: "nowrap" }}>{formatDate(payment.timestamp)}</td>
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
