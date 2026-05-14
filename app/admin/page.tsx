"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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

type Section = "overview" | "users" | "payments" | "leads" | "settings";

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

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const NAV_ITEMS: { key: Section; label: string; icon: string }[] = [
  { key: "overview",  label: "Dashboard",  icon: "⬡" },
  { key: "users",     label: "Users",      icon: "👥" },
  { key: "payments",  label: "Payments",   icon: "💳" },
  { key: "leads",     label: "Leads",      icon: "📥" },
  { key: "settings",  label: "Settings",   icon: "⚙️" },
];

function Sidebar({ section, setSection, onLogout, stats }: {
  section: Section;
  setSection: (s: Section) => void;
  onLogout: () => void;
  stats: Stats | null;
}) {
  const counts: Partial<Record<Section, number>> = {
    users:    stats?.totalUsers,
    payments: stats?.totalPayments,
    leads:    stats?.totalLeads,
  };

  return (
    <aside style={{
      position: "fixed", left: 0, top: 0, bottom: 0, width: 220,
      backgroundColor: "#0a0c14", borderRight: "1px solid rgba(255,255,255,0.07)",
      display: "flex", flexDirection: "column", zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8,
            background: "linear-gradient(135deg, #00d4ff, #0066ff)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 900, color: "#fff" }}>V</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>VisaPro AI</div>
            <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase" }}>Admin</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
        {NAV_ITEMS.map((item) => {
          const active = section === item.key;
          const count = counts[item.key];
          return (
            <button key={item.key} onClick={() => setSection(item.key)}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "9px 12px", borderRadius: 8, marginBottom: 2,
                border: "none", cursor: "pointer", textAlign: "left",
                background: active ? "rgba(0,212,255,0.1)" : "transparent",
                color: active ? "#00d4ff" : "#64748b",
                transition: "all 0.15s",
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                <span style={{ fontSize: 13, fontWeight: active ? 600 : 400 }}>{item.label}</span>
              </div>
              {count != null && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10,
                  background: active ? "rgba(0,212,255,0.15)" : "rgba(255,255,255,0.07)",
                  color: active ? "#00d4ff" : "#475569" }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={onLogout}
          style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "none",
            background: "transparent", cursor: "pointer", display: "flex",
            alignItems: "center", gap: 9, color: "#475569",
            transition: "color 0.15s" }}>
          <span style={{ fontSize: 14 }}>↩</span>
          <span style={{ fontSize: 13 }}>Log out</span>
        </button>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 12px",
          color: "#334155", textDecoration: "none", fontSize: 13, borderRadius: 8 }}>
          <span style={{ fontSize: 14 }}>🏠</span>
          <span>Home</span>
        </a>
      </div>
    </aside>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KPI({ label, value, sub, icon, color }: {
  label: string; value: string | number; sub: string; icon: string; color: string;
}) {
  return (
    <div style={{ borderRadius: 12, border: `1px solid ${color}20`, backgroundColor: "#0d1017",
      padding: "18px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#475569" }}>{sub}</div>
    </div>
  );
}

// ─── Table helpers ─────────────────────────────────────────────────────────────
function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{ textAlign: "left", padding: "8px 10px", color: "#64748b",
      fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em",
      borderBottom: "1px solid rgba(255,255,255,0.06)", whiteSpace: "nowrap" as const }}>
      {children}
    </th>
  );
}
function Td({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <td style={{ padding: "9px 10px", ...style }}>{children}</td>;
}

// ─── Filter bar ───────────────────────────────────────────────────────────────
function FilterBar({ search, setSearch, planFilter, setPlanFilter, onExportCSV, onExportXLSX }: {
  search: string; setSearch: (v: string) => void;
  planFilter: string; setPlanFilter: (v: string) => void;
  onExportCSV: () => void; onExportXLSX: () => void;
}) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
      <input type="text" placeholder="Search email or name…" value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ flex: 1, minWidth: 180, padding: "8px 12px", borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)",
          color: "#e2e8f0", fontSize: 13, outline: "none" }} />
      <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}
        style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
          background: "#0d1017", color: "#e2e8f0", fontSize: 13, cursor: "pointer" }}>
        <option value="">All plans</option>
        <option value="free">Free</option>
        <option value="pro">Pro</option>
        <option value="premium">Premium</option>
      </select>
      <button onClick={onExportCSV}
        style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(16,185,129,0.3)",
          background: "rgba(16,185,129,0.07)", color: "#10b981", fontSize: 12,
          fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" as const }}>
        ↓ CSV
      </button>
      <button onClick={onExportXLSX}
        style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(99,102,241,0.3)",
          background: "rgba(99,102,241,0.07)", color: "#818cf8", fontSize: 12,
          fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" as const }}>
        ↓ Excel
      </button>
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg style={{ width: 32, height: 32, animation: "spin 1s linear infinite" }} fill="none" viewBox="0 0 24 24">
      <circle style={{ opacity: 0.2 }} cx="12" cy="12" r="10" stroke="#00d4ff" strokeWidth="4" />
      <path style={{ opacity: 0.9 }} fill="#00d4ff" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

const card: React.CSSProperties = {
  borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)",
  backgroundColor: "#0d1017", padding: "20px",
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats]       = useState<Stats | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [section, setSection]   = useState<Section>("overview");
  const [acting, setActing]     = useState<string | null>(null);
  const [search, setSearch]     = useState("");
  const [planFilter, setPlan]   = useState("");
  const [debouncedSearch, setDeb] = useState("");

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
    } finally { setLoading(false); }
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
    if (!confirm(`Delete ${email}? This cannot be undone.`)) return;
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

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin-login");
  }

  function exportFile(format: "csv" | "xlsx") {
    const type = section === "overview" ? "users" : section;
    if (type === "settings") return;
    const params = new URLSearchParams({ type, format });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (planFilter) params.set("plan", planFilter);
    window.location.href = `/api/admin/export?${params}`;
  }

  // ── Loading / Error ───────────────────────────────────────────────────────
  if (loading && !stats) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#08090f", display: "flex",
        alignItems: "center", justifyContent: "center" }}>
        <Spinner />
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#08090f", display: "flex",
        alignItems: "center", justifyContent: "center", color: "#fca5a5", fontFamily: "system-ui" }}>
        {error} <button onClick={fetchStats} style={{ marginLeft: 12, color: "#00d4ff", background: "none", border: "none", cursor: "pointer" }}>Retry</button>
      </div>
    );
  }

  // ── Layout ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#08090f", color: "#fff",
      fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:#0a0c14}
        ::-webkit-scrollbar-thumb{background:#1e2a3a;border-radius:4px}
      `}</style>

      <Sidebar section={section} setSection={setSection} onLogout={handleLogout} stats={stats} />

      {/* Main content */}
      <div style={{ marginLeft: 220, minHeight: "100vh" }}>
        {/* Top bar */}
        <div style={{ position: "sticky", top: 0, zIndex: 40, height: 56,
          backgroundColor: "rgba(8,9,15,0.92)", backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 28px" }}>
          <div>
            <span style={{ fontSize: 12, color: "#475569" }}>Admin / </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", textTransform: "capitalize" }}>
              {section}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={fetchStats} disabled={loading}
              style={{ padding: "6px 14px", borderRadius: 7, border: "1px solid rgba(0,212,255,0.2)",
                background: "rgba(0,212,255,0.06)", color: "#00d4ff", fontSize: 12,
                fontWeight: 600, cursor: "pointer" }}>
              {loading ? "…" : "↻ Refresh"}
            </button>
          </div>
        </div>

        {/* Content area */}
        <div style={{ padding: "28px 28px 60px" }}>
          <AnimatePresence mode="wait">
            <motion.div key={section} initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

              {/* ─── Overview ─────────────────────────────────────────────────── */}
              {section === "overview" && stats && (
                <div>
                  <SectionHeader title="Dashboard" sub="Platform overview at a glance" />

                  {/* KPI Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))",
                    gap: 12, marginBottom: 28 }}>
                    <KPI label="Total Users"    value={stats.totalUsers}   sub="Registered"     icon="👥" color="#00d4ff" />
                    <KPI label="Free Users"     value={stats.freeUsers}    sub="On free plan"   icon="🆓" color="#64748b" />
                    <KPI label="Pro Users"      value={stats.proUsers}     sub="Pro plan"       icon="⚡" color="#00d4ff" />
                    <KPI label="Premium Users"  value={stats.premiumUsers} sub="Prime plan"     icon="⭐" color="#a78bfa" />
                    <KPI label="Total Evals"    value={stats.totalUsage}   sub="All-time"       icon="📊" color="#a78bfa" />
                    <KPI label="Total Leads"    value={stats.totalLeads}   sub="Submissions"    icon="📥" color="#f59e0b" />
                    <KPI label="Payments"       value={stats.totalPayments} sub="Captured"      icon="💳" color="#10b981" />
                    <KPI label="Conversion"     value={`${stats.conversionRate}%`} sub="Free → Paid" icon="📈"
                      color={stats.conversionRate >= 10 ? "#10b981" : "#f59e0b"} />
                    <KPI label="Revenue (INR)"
                      value={`₹${Math.round(stats.revenueINR / 100).toLocaleString("en-IN")}`}
                      sub="Total captured" icon="💰" color="#f59e0b" />
                  </div>

                  {/* Recent activity row */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px,1fr))", gap: 16 }}>
                    {/* Recent signups */}
                    <div style={card}>
                      <h3 style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 14, margin: "0 0 14px" }}>
                        Recent Signups
                      </h3>
                      {stats.users.slice(0, 5).map((u) => (
                        <div key={u.id} style={{ display: "flex", justifyContent: "space-between",
                          alignItems: "center", padding: "7px 0",
                          borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <div>
                            <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 500 }}>{u.name ?? u.email}</div>
                            <div style={{ fontSize: 11, color: "#475569" }}>{u.email}</div>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                            {planBadge(u.plan)}
                            <span style={{ fontSize: 10, color: "#334155" }}>{fmtDate(u.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                      <button onClick={() => setSection("users")}
                        style={{ marginTop: 12, fontSize: 12, color: "#00d4ff", background: "none",
                          border: "none", cursor: "pointer", padding: 0 }}>
                        View all users →
                      </button>
                    </div>

                    {/* Recent payments */}
                    <div style={card}>
                      <h3 style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", margin: "0 0 14px" }}>
                        Recent Payments
                      </h3>
                      {stats.recentPayments.slice(0, 5).map((p) => (
                        <div key={p.id} style={{ display: "flex", justifyContent: "space-between",
                          alignItems: "center", padding: "7px 0",
                          borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <div>
                            <div style={{ fontSize: 13, color: "#e2e8f0" }}>{p.email}</div>
                            <div style={{ fontSize: 11, color: "#475569" }}>{p.provider} · {p.plan}</div>
                          </div>
                          <div style={{ textAlign: "right" as const }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#10b981" }}>
                              {fmtAmount(p.amount, p.currency)}
                            </div>
                            <div style={{ fontSize: 10, color: "#334155" }}>{fmtDate(p.createdAt)}</div>
                          </div>
                        </div>
                      ))}
                      <button onClick={() => setSection("payments")}
                        style={{ marginTop: 12, fontSize: 12, color: "#00d4ff", background: "none",
                          border: "none", cursor: "pointer", padding: 0 }}>
                        View all payments →
                      </button>
                    </div>

                    {/* Recent leads */}
                    <div style={card}>
                      <h3 style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", margin: "0 0 14px" }}>
                        Recent Leads
                      </h3>
                      {stats.recentLeads.slice(0, 5).map((l) => (
                        <div key={l.id} style={{ display: "flex", justifyContent: "space-between",
                          alignItems: "center", padding: "7px 0",
                          borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <div>
                            <div style={{ fontSize: 13, color: "#e2e8f0" }}>{l.name}</div>
                            <div style={{ fontSize: 11, color: "#475569" }}>{l.country ?? "—"} · {l.visaCategory ?? "—"}</div>
                          </div>
                          <div style={{ textAlign: "right" as const }}>
                            {l.evaluationScore != null && (
                              <span style={{ fontSize: 12, fontWeight: 700,
                                color: l.evaluationScore >= 75 ? "#10b981" : l.evaluationScore >= 50 ? "#f59e0b" : "#ef4444" }}>
                                {l.evaluationScore}
                              </span>
                            )}
                            <div style={{ fontSize: 10, color: "#334155" }}>{fmtDate(l.createdAt)}</div>
                          </div>
                        </div>
                      ))}
                      <button onClick={() => setSection("leads")}
                        style={{ marginTop: 12, fontSize: 12, color: "#00d4ff", background: "none",
                          border: "none", cursor: "pointer", padding: 0 }}>
                        View all leads →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── Users ───────────────────────────────────────────────────── */}
              {section === "users" && stats && (
                <div>
                  <SectionHeader title="Users" sub={`${stats.totalUsers} registered accounts`} />
                  <div style={card}>
                    <FilterBar search={search} setSearch={setSearch}
                      planFilter={planFilter} setPlanFilter={setPlan}
                      onExportCSV={() => exportFile("csv")} onExportXLSX={() => exportFile("xlsx")} />
                    {!stats.users?.length ? (
                      <p style={{ color: "#475569", fontSize: 13 }}>No users match your filters.</p>
                    ) : (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                          <thead>
                            <tr>
                              {["Email","Name","Phone","Country","Role","Plan","Usage","Contacted","Joined","Actions"].map(h => (
                                <Th key={h}>{h}</Th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {stats.users.map((u) => {
                              const busy = acting?.includes(u.email);
                              return (
                                <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                  <Td style={{ color: "#94a3b8", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{u.email}</Td>
                                  <Td style={{ color: "#cbd5e1" }}>{u.name ?? "—"}</Td>
                                  <Td style={{ color: "#64748b" }}>{u.phone ?? "—"}</Td>
                                  <Td style={{ color: "#64748b" }}>{u.country ?? "—"}</Td>
                                  <Td>
                                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                                      color: u.role === "admin" ? "#f59e0b" : "#64748b",
                                      background: u.role === "admin" ? "rgba(245,158,11,0.1)" : "rgba(100,116,139,0.1)",
                                      border: `1px solid ${u.role === "admin" ? "rgba(245,158,11,0.3)" : "rgba(100,116,139,0.2)"}`,
                                      textTransform: "uppercase" as const }}>
                                      {u.role}
                                    </span>
                                  </Td>
                                  <Td>{planBadge(u.plan)}</Td>
                                  <Td style={{ color: "#e2e8f0", fontWeight: 600, textAlign: "center" as const }}>{u.usageCount}</Td>
                                  <Td style={{ textAlign: "center" as const }}>
                                    <button onClick={() => toggleContact(u.email, u.contacted)} disabled={!!busy}
                                      style={{ padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 600, cursor: "pointer",
                                        color: u.contacted ? "#10b981" : "#64748b",
                                        background: u.contacted ? "rgba(16,185,129,0.1)" : "transparent",
                                        border: `1px solid ${u.contacted ? "rgba(16,185,129,0.35)" : "rgba(100,116,139,0.25)"}` }}>
                                      {u.contacted ? "✓ Done" : "Mark"}
                                    </button>
                                  </Td>
                                  <Td style={{ color: "#64748b", whiteSpace: "nowrap" as const }}>{fmtDate(u.createdAt)}</Td>
                                  <Td>
                                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const }}>
                                      {u.plan === "free" && (
                                        <button onClick={() => upgradeUser(u.email, "pro")} disabled={!!busy}
                                          style={{ padding: "3px 8px", borderRadius: 5, border: "1px solid rgba(0,212,255,0.3)",
                                            background: "rgba(0,212,255,0.08)", color: "#00d4ff", fontSize: 10,
                                            fontWeight: 600, cursor: busy ? "not-allowed" : "pointer", whiteSpace: "nowrap" as const }}>
                                          {acting === `upgrade:${u.email}` ? "…" : "→ Pro"}
                                        </button>
                                      )}
                                      {u.plan !== "premium" && (
                                        <button onClick={() => upgradeUser(u.email, "premium")} disabled={!!busy}
                                          style={{ padding: "3px 8px", borderRadius: 5, border: "1px solid rgba(167,139,250,0.3)",
                                            background: "rgba(167,139,250,0.08)", color: "#a78bfa", fontSize: 10,
                                            fontWeight: 600, cursor: busy ? "not-allowed" : "pointer", whiteSpace: "nowrap" as const }}>
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
                                  </Td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ─── Payments ────────────────────────────────────────────────── */}
              {section === "payments" && stats && (
                <div>
                  <SectionHeader title="Payments" sub={`${stats.totalPayments} captured payments`} />
                  <div style={card}>
                    <FilterBar search={search} setSearch={setSearch}
                      planFilter={planFilter} setPlanFilter={setPlan}
                      onExportCSV={() => exportFile("csv")} onExportXLSX={() => exportFile("xlsx")} />
                    {!stats.recentPayments.length ? (
                      <p style={{ color: "#475569", fontSize: 13 }}>No payments recorded yet.</p>
                    ) : (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                          <thead>
                            <tr>
                              {["Provider","Plan","Email","Amount","Order ID","Payment ID","Status","Date"].map(h => (
                                <Th key={h}>{h}</Th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {stats.recentPayments.map((p) => (
                              <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                <Td>
                                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5,
                                    color: "#00d4ff", background: "rgba(0,212,255,0.1)",
                                    border: "1px solid rgba(0,212,255,0.25)", textTransform: "uppercase" as const }}>
                                    {p.provider}
                                  </span>
                                </Td>
                                <Td>{planBadge(p.plan)}</Td>
                                <Td style={{ color: "#94a3b8" }}>{p.email}</Td>
                                <Td style={{ color: "#10b981", fontWeight: 700 }}>{fmtAmount(p.amount, p.currency)}</Td>
                                <Td style={{ color: "#475569", fontSize: 11, maxWidth: 140, overflow: "hidden",
                                  textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{p.orderId}</Td>
                                <Td style={{ color: "#475569", fontSize: 11, maxWidth: 140, overflow: "hidden",
                                  textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{p.paymentId ?? "—"}</Td>
                                <Td>
                                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5,
                                    color: p.status === "captured" ? "#10b981" : "#f59e0b",
                                    background: p.status === "captured" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                                    border: `1px solid ${p.status === "captured" ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)"}`,
                                    textTransform: "uppercase" as const }}>
                                    {p.status}
                                  </span>
                                </Td>
                                <Td style={{ color: "#64748b", whiteSpace: "nowrap" as const }}>{fmtDate(p.createdAt)}</Td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ─── Leads ───────────────────────────────────────────────────── */}
              {section === "leads" && stats && (
                <div>
                  <SectionHeader title="Leads" sub={`${stats.totalLeads} total submissions`} />
                  <div style={card}>
                    <FilterBar search={search} setSearch={setSearch}
                      planFilter={planFilter} setPlanFilter={setPlan}
                      onExportCSV={() => exportFile("csv")} onExportXLSX={() => exportFile("xlsx")} />
                    {!stats.recentLeads.length ? (
                      <p style={{ color: "#475569", fontSize: 13 }}>No leads yet.</p>
                    ) : (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                          <thead>
                            <tr>
                              {["Name","Email","Phone","Country","Visa Type","Score","Date"].map(h => (
                                <Th key={h}>{h}</Th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {stats.recentLeads.map((l) => (
                              <tr key={l.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                <Td style={{ color: "#e2e8f0", fontWeight: 500 }}>{l.name}</Td>
                                <Td style={{ color: "#94a3b8" }}>{l.email}</Td>
                                <Td style={{ color: "#64748b" }}>{l.phone ?? "—"}</Td>
                                <Td style={{ color: "#64748b" }}>{l.country ?? "—"}</Td>
                                <Td style={{ color: "#64748b" }}>{l.visaCategory ?? "—"}</Td>
                                <Td>
                                  {l.evaluationScore != null ? (
                                    <span style={{ fontWeight: 700,
                                      color: l.evaluationScore >= 75 ? "#10b981" : l.evaluationScore >= 55 ? "#00d4ff" : l.evaluationScore >= 35 ? "#f59e0b" : "#ef4444" }}>
                                      {l.evaluationScore}
                                    </span>
                                  ) : "—"}
                                </Td>
                                <Td style={{ color: "#64748b", whiteSpace: "nowrap" as const }}>{fmtDate(l.createdAt)}</Td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ─── Settings ────────────────────────────────────────────────── */}
              {section === "settings" && (
                <div>
                  <SectionHeader title="Settings" sub="Environment and system configuration" />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", gap: 16 }}>
                    <SettingsCard title="Authentication" items={[
                      { label: "Auth System",      value: "Google OAuth + HMAC Password" },
                      { label: "Session Cookie",   value: "visapro_admin (24h)" },
                      { label: "Intermediate Token", value: "5-minute pre-auth token" },
                      { label: "ADMIN_EMAIL",      value: "Configured via env" },
                      { label: "ADMIN_PASSWORD",   value: "Configured via env" },
                    ]} />
                    <SettingsCard title="Payments" items={[
                      { label: "Provider",         value: "Razorpay (INR)" },
                      { label: "Pro Plan",         value: "₹3,000" },
                      { label: "Premium Plan",     value: "₹9,000" },
                      { label: "Currency",         value: "INR" },
                    ]} />
                    <SettingsCard title="Access Control" items={[
                      { label: "Free Usage Limit", value: "3 evaluations" },
                      { label: "User Session",     value: "visapro_session (HMAC-SHA256)" },
                      { label: "User OAuth",       value: "Google OAuth" },
                      { label: "Protected Routes", value: "/dashboard, /results, /admin" },
                    ]} />
                    <SettingsCard title="Database" items={[
                      { label: "ORM",     value: "Prisma" },
                      { label: "Dev DB",  value: "SQLite (dev.db)" },
                      { label: "Prod DB", value: "PostgreSQL (Neon)" },
                      { label: "Models",  value: "User, Lead, Payment" },
                    ]} />
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px", color: "#f1f5f9" }}>{title}</h1>
      <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>{sub}</p>
    </div>
  );
}

function SettingsCard({ title, items }: { title: string; items: { label: string; value: string }[] }) {
  return (
    <div style={card}>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", margin: "0 0 16px",
        textTransform: "uppercase", letterSpacing: "0.07em" }}>{title}</h3>
      {items.map((item) => (
        <div key={item.label} style={{ display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", gap: 12, padding: "7px 0",
          borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <span style={{ fontSize: 12, color: "#64748b", flexShrink: 0 }}>{item.label}</span>
          <span style={{ fontSize: 12, color: "#e2e8f0", textAlign: "right" as const, fontWeight: 500 }}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}
