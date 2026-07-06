import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = new (PrismaClient as any)({});
  globalForPrisma.prisma = client;
  return client;
}
