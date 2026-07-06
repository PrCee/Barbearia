import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  // Prisma v7 requires adapter — usar o config-based adapter do prisma.config.ts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (PrismaClient as any)({
    datasourceUrl: process.env.DATABASE_URL,
  });
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
