import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { deleteUser } from "@/lib/db/users";

export async function DELETE(req: NextRequest) {
  if (!getAdminFromRequest(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { email } = (await req.json()) as { email?: string };
  if (!email) return NextResponse.json({ error: "Email required." }, { status: 400 });

  const deleted = await deleteUser(email);
  if (!deleted) return NextResponse.json({ error: "User not found." }, { status: 404 });
  return NextResponse.json({ success: true });
}
