import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { getAllUsers } from "@/lib/db/users";
import { getLeads } from "@/lib/db/leads";
import { getPayments } from "@/lib/db/payments";

function csv(val: string | number | boolean | null | undefined): string {
  if (val == null) return "";
  const s = String(val);
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

function fmt(d: Date | string | null | undefined): string {
  if (!d) return "";
  try { return new Date(d).toLocaleString(); } catch { return String(d); }
}

export async function GET(req: NextRequest) {
  if (!getAdminFromRequest(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const sp     = req.nextUrl.searchParams;
  const type   = sp.get("type")    ?? "users";
  const search = sp.get("search")  ?? undefined;
  const plan   = sp.get("plan")    ?? undefined;
  const country = sp.get("country") ?? undefined;
  const visa   = sp.get("visa")    ?? undefined;

  let rows: string[] = [];

  if (type === "payments") {
    const payments = await getPayments({ search, plan, limit: 5000 });
    rows = [
      "Provider,Order ID,Payment ID,Plan,Email,Amount (INR),Currency,Status,Date",
      ...payments.map((p) =>
        [
          csv(p.provider),
          csv(p.orderId),
          csv(p.paymentId ?? ""),
          csv(p.plan),
          csv(p.email),
          csv((p.amount / 100).toFixed(2)),
          csv(p.currency),
          csv(p.status),
          csv(fmt(p.createdAt)),
        ].join(",")
      ),
    ];
  } else if (type === "leads") {
    const leads = await getLeads({ search, country, visaCategory: visa, limit: 5000 });
    rows = [
      "Name,Email,Phone,Country,Visa Category,Score,Date",
      ...leads.map((l) =>
        [
          csv(l.name),
          csv(l.email),
          csv(l.phone ?? ""),
          csv(l.country ?? ""),
          csv(l.visaCategory ?? ""),
          csv(l.evaluationScore ?? ""),
          csv(fmt(l.createdAt)),
        ].join(",")
      ),
    ];
  } else {
    const users = await getAllUsers({ search, plan, country });
    rows = [
      "ID,Email,Name,Phone,Country,Role,Plan,Usage,Contacted,Joined,Upgraded",
      ...users.map((u) =>
        [
          csv(u.id),
          csv(u.email),
          csv(u.name ?? ""),
          csv(u.phone ?? ""),
          csv(u.country ?? ""),
          csv(u.role),
          csv(u.plan),
          csv(u.usageCount),
          csv(u.contacted ? "Yes" : "No"),
          csv(fmt(u.createdAt)),
          csv(u.upgradedAt ? fmt(u.upgradedAt) : ""),
        ].join(",")
      ),
    ];
  }

  const content = rows.join("\n");

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="visapro_${type}_${Date.now()}.csv"`,
    },
  });
}
