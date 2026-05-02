import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { markContacted } from "@/lib/services/userStore";

export async function POST(req: NextRequest) {
  if (!getAdminFromRequest(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { email, contacted } = await req.json() as {
    email?: string;
    contacted?: boolean;
  };
  if (!email) return NextResponse.json({ error: "Email required." }, { status: 400 });

  const user = markContacted(email, contacted ?? true);
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
  return NextResponse.json({ success: true, user });
}
