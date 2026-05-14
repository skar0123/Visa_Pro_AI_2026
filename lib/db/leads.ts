import { prisma } from "@/lib/db";

export interface LeadInput {
  name: string;
  email: string;
  phone?: string;
  country?: string;
  visaCategory?: string;
  evaluationScore?: number;
  evaluationData?: string;
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export async function captureLead(input: LeadInput) {
  const email = input.email.toLowerCase().trim();

  const user = await prisma.user.findUnique({ where: { email } });

  return prisma.lead.create({
    data: {
      name:            input.name.slice(0, 120),
      email,
      phone:           input.phone ?? null,
      country:         input.country ?? null,
      visaCategory:    input.visaCategory ?? null,
      evaluationScore: input.evaluationScore ?? null,
      evaluationData:  input.evaluationData ?? null,
      userId:          user?.id ?? null,
    },
  });
}

export async function getLeads(opts?: {
  search?: string;
  country?: string;
  visaCategory?: string;
  limit?: number;
  offset?: number;
}) {
  const limit  = opts?.limit  ?? 50;
  const offset = opts?.offset ?? 0;

  return prisma.lead.findMany({
    where: {
      ...(opts?.country      ? { country:      opts.country }                              : {}),
      ...(opts?.visaCategory ? { visaCategory: opts.visaCategory }                        : {}),
      ...(opts?.search
        ? { OR: [{ email: { contains: opts.search } }, { name: { contains: opts.search } }] }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take:   limit,
    skip:   offset,
  });
}

export async function getLeadCount() {
  return prisma.lead.count();
}
