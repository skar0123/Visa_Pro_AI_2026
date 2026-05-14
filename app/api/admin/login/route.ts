import { NextResponse } from "next/server";

// Replaced by Google OAuth + password two-factor flow.
// Step 1: GET /api/auth/admin/google
// Step 2: POST /api/admin/verify-password
export async function POST() {
  return NextResponse.json(
    { error: "This endpoint is no longer available. Use the admin login page." },
    { status: 410 }
  );
}
