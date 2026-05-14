import { prisma } from "@/lib/db";

export const FREE_USAGE_LIMIT = 3;

export async function getOrCreateUser(email: string, name?: string) {
  const key = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email: key } });
  if (existing) {
    if (name && !existing.name) {
      return prisma.user.update({ where: { email: key }, data: { name } });
    }
    return existing;
  }

  return prisma.user.create({
    data: {
      email: key,
      name: name ?? null,
      role: "user",
      plan: "free",
      usageCount: 0,
    },
  });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
}

export async function upgradePlan(email: string, plan: "pro" | "premium") {
  return prisma.user.update({
    where: { email: email.toLowerCase().trim() },
    data: { plan, upgradedAt: new Date() },
  });
}

// backward-compat alias used by older code paths
export async function upgradeToPremium(email: string) {
  return upgradePlan(email, "premium");
}

export async function incrementUsage(email: string) {
  await prisma.user.updateMany({
    where: { email: email.toLowerCase().trim() },
    data: { usageCount: { increment: 1 } },
  });
}

export async function deleteUser(email: string) {
  const key = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: key } });
  if (!user) return false;
  await prisma.user.delete({ where: { email: key } });
  return true;
}

export async function markContacted(email: string, contacted: boolean) {
  return prisma.user.update({
    where: { email: email.toLowerCase().trim() },
    data: { contacted },
  });
}

export async function getAllUsers(opts?: {
  search?: string;
  plan?: string;
  country?: string;
}) {
  return prisma.user.findMany({
    where: {
      ...(opts?.plan ? { plan: opts.plan } : {}),
      ...(opts?.country ? { country: opts.country } : {}),
      ...(opts?.search
        ? {
            OR: [
              { email: { contains: opts.search } },
              { name: { contains: opts.search } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUserStats() {
  const [total, free, pro, premium] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { plan: "free" } }),
    prisma.user.count({ where: { plan: "pro" } }),
    prisma.user.count({ where: { plan: "premium" } }),
  ]);
  const totalUsage = await prisma.user.aggregate({ _sum: { usageCount: true } });
  return {
    total,
    free,
    pro,
    premium,
    totalUsage: totalUsage._sum.usageCount ?? 0,
  };
}
