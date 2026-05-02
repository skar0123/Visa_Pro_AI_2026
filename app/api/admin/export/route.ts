import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { getAllUsers } from "@/lib/services/userStore";
import { getAdminStats } from "@/lib/services/leadCapture";

function escapeCsv(val: string | number | boolean | undefined | null): string {
  if (val == null) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  if (!getAdminFromRequest(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const type = req.nextUrl.searchParams.get("type") ?? "users";

  let csv = "";

  if (type === "payments") {
    const { recentPayments } = getAdminStats();
    csv = ["Provider,Email,Amount,Currency,Date"]
      .concat(
        recentPayments.map((p) =>
          [
            escapeCsv(p.provider),
            escapeCsv(p.email),
            escapeCsv(p.amount / 100),
            escapeCsv(p.currency.toUpperCase()),
            escapeCsv(new Date(p.timestamp).toLocaleString()),
          ].join(",")
        )
      )
      .join("\n");
  } else if (type === "leads") {
    const { recentLeads } = getAdminStats();
    csv = ["Name,Email,Score,Visa Preference,Date"]
      .concat(
        recentLeads.map((l) =>
          [
            escapeCsv(l.name),
            escapeCsv(l.email),
            escapeCsv(l.score),
            escapeCsv(l.visaPreference ?? ""),
            escapeCsv(new Date(l.timestamp).toLocaleString()),
          ].join(",")
        )
      )
      .join("\n");
  } else {
    const users = getAllUsers();
    csv = ["ID,Email,Name,Plan,Usage,Contacted,Joined,Upgraded"]
      .concat(
        users.map((u) =>
          [
            escapeCsv(u.id),
            escapeCsv(u.email),
            escapeCsv(u.name ?? ""),
            escapeCsv(u.plan),
            escapeCsv(u.usage_count),
            escapeCsv(u.contacted ? "Yes" : "No"),
            escapeCsv(new Date(u.created_at).toLocaleString()),
            escapeCsv(u.upgraded_at ? new Date(u.upgraded_at).toLocaleString() : ""),
          ].join(",")
        )
      )
      .join("\n");
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type":        "text/csv",
      "Content-Disposition": `attachment; filename="visapro_${type}_${Date.now()}.csv"`,
    },
  });
}
