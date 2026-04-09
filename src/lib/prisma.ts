import { PrismaClient } from '@prisma/client';

// ---------------------------------------------------------------------------
// Prisma singleton — prevents exhausting the DB connection pool during
// Next.js hot-reloads in development (each reload would otherwise create a
// new PrismaClient instance).
// ---------------------------------------------------------------------------

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
