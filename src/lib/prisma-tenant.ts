/**
 * Client Prisma tenant-aware
 * Injecte schoolId automatiquement dans toutes les requêtes
 * pour garantir l'isolation stricte entre écoles.
 */
import { prisma } from "@/lib/prisma"


// Tables soumises à l'isolation tenant (tables avec un champ schoolId non optionnel)
const TENANT_TABLES = new Set([
  "user", "group", "announcement", "notification",
  "auditLog", "exam", "directMessage", "badge",
  "student", "teacher", "parent", "admin",
  "attendance", "qrScanLog", "memorizationProgress", "evaluation",
  "dailyProgressLog", "halaqaSession", "halaqaEvaluation",
  "libraryContent", "libraryCollection", "libraryCategory",
  "feedback", "broadcast", "parentAttendance",
  "schoolUpdateRequest", "certificateTemplate",
  // Note : uploadedFile a schoolId nullable (NULL = fichier global), il est
  // exclu pour ne pas bloquer les fichiers globaux. schoolRequest est global et
  // n'a pas de champ schoolId.
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
          if (["findMany", "findFirst", "findFirstOrThrow", "findUnique", "findUniqueOrThrow", "count", "aggregate", "groupBy"].includes(operation)) {
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

          // Upsert : sécuriser where + create
          if (operation === "upsert") {
            args = {
              ...args,
              where: { ...(args.where as object ?? {}), schoolId },
              create: { ...(args.create as object ?? {}), schoolId },
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

// Alias legacy pour compatibilité
export { tenantPrisma as tenantClient, prisma }
