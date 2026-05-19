/**
 * TAHFIDZ SaaS — Client Prisma tenant-aware
 *
 * Chaque appel au client est automatiquement scopé sur le schoolId du contexte.
 * On ne peut jamais accéder à des données d'une autre école par inadvertance.
 *
 * Usage :
 *   const db = tenantClient(schoolId)
 *   const students = await db.student.findMany()  // WHERE schoolId = ?
 */

import { PrismaClient, Prisma } from "@prisma/client";

// ─── Singleton global Prisma ────────────────────────────────────────────────

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// ─── Tables soumises à l'isolation par schoolId ─────────────────────────────

const TENANT_MODELS = [
  "user",
  "student",
  "teacher",
  "class",
  "enrollment",
  "memorizationRecord",
  "recitationSession",
  "attendance",
  "fee",
  "payment",
  "notification",
  "auditLog",
] as const;

type TenantModel = (typeof TENANT_MODELS)[number];

// ─── Extension Prisma : injection automatique du schoolId ───────────────────

/**
 * Retourne un client Prisma étendu qui injecte `schoolId` dans chaque
 * `where`, `create` et `createMany` pour les modèles tenant-aware.
 *
 * @throws {Error} si schoolId est vide (protection fail-closed)
 */
export function tenantClient(schoolId: string) {
  if (!schoolId?.trim()) {
    throw new Error("[TenantClient] schoolId manquant — accès refusé");
  }

  return prisma.$extends({
    name: `tenant:${schoolId}`,
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Ignorer les tables globales (SurahRef, School elle-même)
          const modelKey = (model.charAt(0).toLowerCase() +
            model.slice(1)) as string;

          if (!TENANT_MODELS.includes(modelKey as TenantModel)) {
            return query(args);
          }

          // ── Injection pour les lectures ──────────────────────────────
          if (
            operation === "findMany" ||
            operation === "findFirst" ||
            operation === "findUnique" ||
            operation === "count" ||
            operation === "aggregate" ||
            operation === "groupBy"
          ) {
            args.where = { ...args.where, schoolId };
          }

          // ── Injection pour les créations ─────────────────────────────
          if (operation === "create") {
            args.data = { ...args.data, schoolId };
          }

          if (operation === "createMany") {
            if (Array.isArray(args.data)) {
              args.data = args.data.map((d: Record<string, unknown>) => ({
                ...d,
                schoolId,
              }));
            }
          }

          // ── Injection pour les mises à jour (sécurité double) ────────
          if (operation === "update" || operation === "updateMany") {
            args.where = { ...args.where, schoolId };
          }

          // ── Injection pour les suppressions ──────────────────────────
          if (operation === "delete" || operation === "deleteMany") {
            args.where = { ...args.where, schoolId };
          }

          return query(args);
        },
      },
    },
  });
}

export type TenantClient = ReturnType<typeof tenantClient>;
