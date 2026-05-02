import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { getOrCreateUser, upgradeToPremium } from "@/lib/services/userStore";

export async function POST(req: NextRequest) {
  if (!getAdminFromRequest(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { email } = await req.json() as { email?: string };
  if (!email) return NextResponse.json({ error: "Email required." }, { status: 400 });

  getOrCreateUser(email);
  const user = upgradeToPremium(email);
  return NextResponse.json({ success: true, user });
}
