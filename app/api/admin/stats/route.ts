import { NextRequest, NextResponse } from "next/server";
import { getAdminStats } from "@/lib/services/leadCapture";
import { getAllUsers } from "@/lib/services/userStore";

export async function GET(request: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret) {
    return NextResponse.json(
      { error: "Admin access not configured." },
      { status: 503 }
    );
  }

  const provided = request.headers.get("x-admin-secret");
  if (!provided || provided !== adminSecret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const stats = getAdminStats();
  const users = getAllUsers();

  const freeUsers = users.filter((u) => u.plan === "free").length;
  const premiumUsers = users.filter((u) => u.plan === "premium").length;
  const totalUsage = users.reduce((sum, u) => sum + u.usage_count, 0);

  return NextResponse.json({
    ...stats,
    users,
    freeUsers,
    premiumUsers,
    totalUsage,
  });
}
