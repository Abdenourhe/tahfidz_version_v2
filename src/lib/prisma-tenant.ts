/**
 * Client Prisma tenant-aware
 * Injecte schoolId automatiquement dans toutes les requêtes
 * pour garantir l'isolation stricte entre écoles.
 */
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

// Tables soumises à l'isolation tenant
const TENANT_TABLES = new Set([
  "user", "group", "announcement", "notification",
  "auditLog", "exam", "directMessage", "badge",
])

/**
 * Retourne un client Prisma étendu qui injecte `schoolId` automatiquement.
 * Utilisation : const db = tenantPrisma(session.user.schoolId)
 */
export function tenantPrisma(schoolId: string) {
  if (!schoolId?.trim()) {
    throw new Error("[tenantPrisma] schoolId manquant — accès refusé")
  }

  return prisma.$extends({
    name: `tenant:${schoolId}`,
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: {
          model: string
          operation: string
          args: Record<string, unknown>
          query: (args: Record<string, unknown>) => Promise<unknown>
        }) {
          const modelKey = model.charAt(0).toLowerCase() + model.slice(1)

          if (!TENANT_TABLES.has(modelKey)) {
            return query(args)
          }

          // Lectures
          if (["findMany", "findFirst", "findUnique", "count", "aggregate", "groupBy"].includes(operation)) {
            args = { ...args, where: { ...(args.where as object ?? {}), schoolId } }
          }

          // Créations
          if (operation === "create") {
            args = { ...args, data: { ...(args.data as object ?? {}), schoolId } }
          }

          if (operation === "createMany" && Array.isArray(args.data)) {
            args = {
              ...args,
              data: (args.data as Record<string, unknown>[]).map(d => ({ ...d, schoolId })),
            }
          }

          // Mises à jour (double sécurité)
          if (["update", "updateMany"].includes(operation)) {
            args = { ...args, where: { ...(args.where as object ?? {}), schoolId } }
          }

          // Suppressions
          if (["delete", "deleteMany"].includes(operation)) {
            args = { ...args, where: { ...(args.where as object ?? {}), schoolId } }
          }

          return query(args)
        },
      },
    },
  })
}

export type TenantPrisma = ReturnType<typeof tenantPrisma>
