// src/lib/prisma.ts
// Singleton Prisma avec middleware audit intégré

import { PrismaClient } from "@prisma/client"
import { setupAuditMiddleware } from "@/lib/audit"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

// ── Activer le middleware audit ────────────────────────────────────
// Décommenter la ligne ci-dessous pour activer l'audit automatique
// sur TOUTES les opérations Prisma (create, update, delete)
// Attention : peut impacter les performances — utiliser avec modération
// setupAuditMiddleware(prisma)

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma