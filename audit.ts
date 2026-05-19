/**
 * TAHFIDZ SaaS — Phase 5 : AuditLog automatique
 *
 * Extension Prisma qui intercepte create/update/delete sur les modèles sensibles
 * et écrit automatiquement dans AuditLog — sans modifier les services.
 *
 * Usage : remplacer tenantClient() par auditedTenantClient() dans les services
 * qui nécessitent une traçabilité complète (School Admin, paiements, etc.)
 */

import { tenantClient } from "@/lib/prisma-tenant";
import { prisma } from "@/lib/prisma-tenant";

// Modèles dont chaque mutation est journalisée
const AUDITED_MODELS = new Set([
  "Student",
  "Teacher",
  "Class",
  "Enrollment",
  "MemorizationRecord",
  "Payment",
  "Fee",
]);

type AuditContext = {
  schoolId: string;
  userId:   string;
  ip?:      string;
};

/**
 * Client Prisma tenant-aware ET audité.
 * Chaque create/update/delete sur un modèle sensible génère une entrée AuditLog.
 */
export function auditedTenantClient(ctx: AuditContext) {
  const base = tenantClient(ctx.schoolId);

  return base.$extends({
    name: `audit:${ctx.schoolId}:${ctx.userId}`,
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const shouldAudit =
            AUDITED_MODELS.has(model) &&
            ["create", "update", "updateMany", "delete", "deleteMany"].includes(operation);

          if (!shouldAudit) return query(args);

          // Snapshot avant (pour update/delete)
          let before: unknown = null;
          if ((operation === "update" || operation === "delete") && args.where?.id) {
            try {
              before = await (prisma as any)[model.charAt(0).toLowerCase() + model.slice(1)].findUnique({
                where: args.where,
              });
            } catch { /* ignore */ }
          }

          // Exécuter l'opération
          const result = await query(args);

          // Écriture asynchrone de l'audit (fire-and-forget)
          const diff: Record<string, unknown> = {};
          if (before) diff.before = before;
          if (operation.startsWith("create")) diff.after = result;
          if (operation === "update") diff.after = result;
          if (operation.includes("delete")) diff.deleted = before;

          prisma.auditLog.create({
            data: {
              schoolId: ctx.schoolId,
              userId:   ctx.userId,
              action:   operation.toUpperCase(),
              entity:   model,
              entityId: (result as any)?.id ?? (args.where as any)?.id ?? "unknown",
              diff,
              ip:       ctx.ip,
            },
          }).catch((e) => console.error("[AuditLog] Échec écriture:", e));

          return result;
        },
      },
    },
  });
}
