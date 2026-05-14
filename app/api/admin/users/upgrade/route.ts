import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { getOrCreateUser, upgradePlan } from "@/lib/db/users";

export async function POST(req: NextRequest) {
  if (!getAdminFromRequest(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { email, plan } = (await req.json()) as { email?: string; plan?: string };
  if (!email) return NextResponse.json({ error: "Email required." }, { status: 400 });

  const targetPlan: "pro" | "premium" =
    plan === "pro" ? "pro" : "premium";

  await getOrCreateUser(email);
  const user = await upgradePlan(email, targetPlan);
  return NextResponse.json({ success: true, user });
}
