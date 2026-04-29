import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/services/session";

export async function GET(req: NextRequest) {
  const session = getSessionFromCookie(req);
  return NextResponse.json({ isPaid: session?.isPaid === true });
}
