import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { getAdminStats } from "@/lib/services/leadCapture";
import { getAllUsers } from "@/lib/services/userStore";

export async function GET(request: NextRequest) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const stats       = getAdminStats();
  const users       = getAllUsers();
  const freeUsers   = users.filter((u) => u.plan === "free").length;
  const premiumUsers= users.filter((u) => u.plan === "premium").length;
  const totalUsage  = users.reduce((sum, u) => sum + u.usage_count, 0);

  return NextResponse.json({ ...stats, users, freeUsers, premiumUsers, totalUsage });
}
