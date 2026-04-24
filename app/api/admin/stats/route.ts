import { NextRequest, NextResponse } from "next/server";
import { getAdminStats } from "@/lib/services/leadCapture";

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
  return NextResponse.json(stats);
}
