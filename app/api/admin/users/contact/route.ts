import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { markContacted } from "@/lib/db/users";

export async function POST(req: NextRequest) {
  if (!getAdminFromRequest(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { email, contacted } = (await req.json()) as {
    email?: string;
    contacted?: boolean;
  };
  if (!email) return NextResponse.json({ error: "Email required." }, { status: 400 });

  const user = await markContacted(email, contacted ?? true);
  return NextResponse.json({ success: true, user });
}
