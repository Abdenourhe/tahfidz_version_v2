// src/lib/prisma.ts
// Singleton Prisma avec middleware audit intégré

import { PrismaClient } from "@prisma/client"
import { setupAuditMiddleware } from "@/lib/audit-middleware"

// ═══ FALLBACK VERCEL : utiliser la connexion directe (non-pooling) en priorité ═══
if (!process.env.DATABASE_URL) {
  if (process.env.POSTGRES_URL_NON_POOLING) {
    process.env.DATABASE_URL = process.env.POSTGRES_URL_NON_POOLING
  } else if (process.env.POSTGRES_URL) {
    process.env.DATABASE_URL = process.env.POSTGRES_URL
  }
}

// En production, si DATABASE_URL pointe vers un pooler Neon injoignable,
// on force l'utilisation de la connexion directe pour le build/prerender.
if (
  process.env.NODE_ENV === "production" &&
  process.env.DATABASE_URL &&
  process.env.DATABASE_URL.includes("-pooler") &&
  process.env.POSTGRES_URL_NON_POOLING
) {
  process.env.DATABASE_URL = process.env.POSTGRES_URL_NON_POOLING
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Ne jamais instancier Prisma côté client (navigateur)
const isServer = typeof window === "undefined"

export const prisma = isServer
  ? (globalForPrisma.prisma ??
      new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
      }))
  : (undefined as unknown as PrismaClient)

// ── Activer le middleware audit (serveur uniquement) ───────────────
if (isServer) {
  setupAuditMiddleware(prisma)
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
}
