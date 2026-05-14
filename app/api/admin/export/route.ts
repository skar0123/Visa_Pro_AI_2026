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

// SpreadsheetML — opens natively in Excel without any npm deps
function buildXlsx(headers: string[], dataRows: (string | number)[][]): string {
  function xlCell(val: string | number) {
    if (typeof val === "number") {
      return `<Cell><Data ss:Type="Number">${val}</Data></Cell>`;
    }
    const escaped = String(val ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
    return `<Cell><Data ss:Type="String">${escaped}</Data></Cell>`;
  }

  const headerRow = `<Row>${headers.map((h) => xlCell(h)).join("")}</Row>`;
  const bodyRows  = dataRows
    .map((row) => `<Row>${row.map((c) => xlCell(c)).join("")}</Row>`)
    .join("");

  return `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="header">
      <Font ss:Bold="1"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Sheet1">
    <Table>${headerRow}${bodyRows}</Table>
  </Worksheet>
</Workbook>`;
}

export async function GET(req: NextRequest) {
  if (!getAdminFromRequest(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const sp      = req.nextUrl.searchParams;
  const type    = sp.get("type")    ?? "users";
  const format  = sp.get("format")  ?? "csv";   // "csv" | "xlsx"
  const search  = sp.get("search")  ?? undefined;
  const plan    = sp.get("plan")    ?? undefined;
  const country = sp.get("country") ?? undefined;
  const visa    = sp.get("visa")    ?? undefined;

  const isXlsx = format === "xlsx";

  // ── Build data ──────────────────────────────────────────────────────────────
  let csvRows: string[]       = [];
  let xlHeaders: string[]     = [];
  let xlData: (string | number)[][] = [];

  if (type === "payments") {
    const payments = await getPayments({ search, plan, limit: 5000 });

    xlHeaders = ["Provider","Order ID","Payment ID","Plan","Email","Amount","Currency","Status","Date"];
    xlData    = payments.map((p) => [
      p.provider, p.orderId, p.paymentId ?? "", p.plan, p.email,
      p.amount / 100, p.currency, p.status, fmt(p.createdAt),
    ]);

    csvRows = [
      "Provider,Order ID,Payment ID,Plan,Email,Amount,Currency,Status,Date",
      ...payments.map((p) =>
        [csv(p.provider), csv(p.orderId), csv(p.paymentId ?? ""), csv(p.plan),
         csv(p.email), csv((p.amount / 100).toFixed(2)), csv(p.currency),
         csv(p.status), csv(fmt(p.createdAt))].join(",")
      ),
    ];
  } else if (type === "leads") {
    const leads = await getLeads({ search, country, visaCategory: visa, limit: 5000 });

    xlHeaders = ["Name","Email","Phone","Country","Visa Category","Score","Date"];
    xlData    = leads.map((l) => [
      l.name, l.email, l.phone ?? "", l.country ?? "",
      l.visaCategory ?? "", l.evaluationScore ?? "", fmt(l.createdAt),
    ]);

    csvRows = [
      "Name,Email,Phone,Country,Visa Category,Score,Date",
      ...leads.map((l) =>
        [csv(l.name), csv(l.email), csv(l.phone ?? ""), csv(l.country ?? ""),
         csv(l.visaCategory ?? ""), csv(l.evaluationScore ?? ""),
         csv(fmt(l.createdAt))].join(",")
      ),
    ];
  } else {
    const users = await getAllUsers({ search, plan, country });

    xlHeaders = ["ID","Email","Name","Phone","Country","Role","Plan","Usage","Contacted","Joined","Upgraded"];
    xlData    = users.map((u) => [
      u.id, u.email, u.name ?? "", u.phone ?? "", u.country ?? "",
      u.role, u.plan, u.usageCount, u.contacted ? "Yes" : "No",
      fmt(u.createdAt), u.upgradedAt ? fmt(u.upgradedAt) : "",
    ]);

    csvRows = [
      "ID,Email,Name,Phone,Country,Role,Plan,Usage,Contacted,Joined,Upgraded",
      ...users.map((u) =>
        [csv(u.id), csv(u.email), csv(u.name ?? ""), csv(u.phone ?? ""),
         csv(u.country ?? ""), csv(u.role), csv(u.plan), csv(u.usageCount),
         csv(u.contacted ? "Yes" : "No"), csv(fmt(u.createdAt)),
         csv(u.upgradedAt ? fmt(u.upgradedAt) : "")].join(",")
      ),
    ];
  }

  // ── Return response ─────────────────────────────────────────────────────────
  if (isXlsx) {
    const content = buildXlsx(xlHeaders, xlData);
    return new NextResponse(content, {
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": `attachment; filename="visapro_${type}_${Date.now()}.xlsx"`,
      },
    });
  }

  return new NextResponse(csvRows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="visapro_${type}_${Date.now()}.csv"`,
    },
  });
}
