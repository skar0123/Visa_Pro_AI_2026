import { prisma } from "@/lib/db";

export interface CreatePaymentInput {
  email:    string;
  orderId:  string;
  plan:     string;
  amount:   number;
  currency?: string;
}

export async function createPendingPayment(input: CreatePaymentInput) {
  const email = input.email.toLowerCase().trim();
  const user  = await prisma.user.findUnique({ where: { email } });

  return prisma.payment.create({
    data: {
      email,
      orderId:  input.orderId,
      plan:     input.plan,
      amount:   input.amount,
      currency: input.currency ?? "INR",
      status:   "pending",
      userId:   user?.id ?? null,
    },
  });
}

export async function capturePayment(
  orderId: string,
  paymentId: string,
  signature: string
) {
  return prisma.payment.update({
    where: { orderId },
    data:  { paymentId, signature, status: "captured" },
  });
}

export async function getPayments(opts?: {
  search?: string;
  plan?: string;
  limit?: number;
}) {
  const limit = opts?.limit ?? 50;

  return prisma.payment.findMany({
    where: {
      ...(opts?.plan   ? { plan:  opts.plan }                                                   : {}),
      ...(opts?.search ? { email: { contains: opts.search } }                                   : {}),
      status: "captured",
    },
    orderBy: { createdAt: "desc" },
    take:    limit,
  });
}

export async function getPaymentCount() {
  return prisma.payment.count({ where: { status: "captured" } });
}

export async function getRevenueEstimateINR() {
  const result = await prisma.payment.aggregate({
    where:  { status: "captured", currency: "INR" },
    _sum:   { amount: true },
  });
  return result._sum.amount ?? 0;
}
