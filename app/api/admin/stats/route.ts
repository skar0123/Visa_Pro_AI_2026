import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { getAllUsers, getUserStats } from "@/lib/db/users";
import { getLeads, getLeadCount } from "@/lib/db/leads";
import { getPayments, getPaymentCount, getRevenueEstimateINR } from "@/lib/db/payments";

export async function GET(request: NextRequest) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const search      = searchParams.get("search")      ?? undefined;
  const planFilter  = searchParams.get("plan")        ?? undefined;
  const countryFilter = searchParams.get("country")   ?? undefined;
  const visaFilter  = searchParams.get("visa")        ?? undefined;

  const [userStats, users, leads, payments, leadCount, paymentCount, revenueINR] =
    await Promise.all([
      getUserStats(),
      getAllUsers({ search, plan: planFilter, country: countryFilter }),
      getLeads({ search, country: countryFilter, visaCategory: visaFilter, limit: 50 }),
      getPayments({ search, plan: planFilter, limit: 50 }),
      getLeadCount(),
      getPaymentCount(),
      getRevenueEstimateINR(),
    ]);

  const conversionRate =
    userStats.total > 0
      ? Math.round(((userStats.pro + userStats.premium) / userStats.total) * 100)
      : 0;

  return NextResponse.json({
    // Aggregate stats
    totalUsers:     userStats.total,
    freeUsers:      userStats.free,
    proUsers:       userStats.pro,
    premiumUsers:   userStats.premium,
    totalUsage:     userStats.totalUsage,
    totalLeads:     leadCount,
    totalPayments:  paymentCount,
    conversionRate,
    revenueINR,

    // Lists (filtered)
    users,
    recentLeads:    leads,
    recentPayments: payments,
  });
}
