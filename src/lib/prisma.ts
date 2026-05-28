// src/lib/prisma.ts
// Singleton Prisma avec middleware audit intégré

import { PrismaClient } from "@prisma/client"
import { setupAuditMiddleware } from "@/lib/audit"

// ═══ FALLBACK VERCEL : POSTGRES_URL → DATABASE_URL ═══
if (!process.env.DATABASE_URL && process.env.POSTGRES_URL) {
  process.env.DATABASE_URL = process.env.POSTGRES_URL
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

// ── Activer le middleware audit ────────────────────────────────────
// setupAuditMiddleware(prisma)

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma