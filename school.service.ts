/**
 * TAHFIDZ SaaS — SchoolService
 *
 * Gestion des tenants (création, mise à jour du plan, suspension).
 * Seul le SUPER_ADMIN peut appeler ces méthodes.
 */

import { prisma } from "@/lib/prisma-tenant";
import { Plan, Prisma } from "@prisma/client";
import { z } from "zod";

// ─── Validation ──────────────────────────────────────────────────────────────

const slugRegex = /^[a-z0-9]([a-z0-9-]{1,30})[a-z0-9]$/;

export const CreateSchoolSchema = z.object({
  name: z.string().min(3).max(100),
  slug: z
    .string()
    .regex(slugRegex, "Slug invalide (minuscules, chiffres, tirets, 3-32 chars)"),
  plan: z.nativeEnum(Plan).default("FREE"),
  settings: z
    .object({
      locale: z.string().default("fr-MA"),
      timezone: z.string().default("Africa/Casablanca"),
      currency: z.string().length(3).default("MAD"),
    })
    .default({}),
});

export type CreateSchoolInput = z.infer<typeof CreateSchoolSchema>;

// ─── Service ─────────────────────────────────────────────────────────────────

export class SchoolService {
  /**
   * Crée un nouveau tenant.
   * @throws ConflictError si le slug est déjà pris.
   */
  static async create(input: CreateSchoolInput) {
    const data = CreateSchoolSchema.parse(input);

    const existing = await prisma.school.findUnique({
      where: { slug: data.slug },
    });
    if (existing) {
      throw new ConflictError(`Le slug « ${data.slug} » est déjà utilisé.`);
    }

    return prisma.school.create({
      data: {
        name: data.name,
        slug: data.slug,
        plan: data.plan,
        settings: data.settings as Prisma.InputJsonValue,
      },
    });
  }

  /** Liste toutes les écoles (super-admin uniquement). */
  static async list(opts?: { isActive?: boolean; plan?: Plan }) {
    return prisma.school.findMany({
      where: {
        ...(opts?.isActive !== undefined && { isActive: opts.isActive }),
        ...(opts?.plan && { plan: opts.plan }),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, slug: true, plan: true,
        isActive: true, createdAt: true,
        _count: { select: { students: true, users: true } },
      },
    });
  }

  /** Charge une école par slug (utilisé dans le middleware de routage). */
  static async findBySlug(slug: string) {
    const school = await prisma.school.findUnique({ where: { slug } });
    if (!school) throw new NotFoundError(`École « ${slug} » introuvable.`);
    if (!school.isActive) throw new ForbiddenError("Ce compte est suspendu.");
    return school;
  }

  /** Change le plan d'abonnement. */
  static async upgradePlan(schoolId: string, plan: Plan) {
    return prisma.school.update({
      where: { id: schoolId },
      data:  { plan, updatedAt: new Date() },
    });
  }

  /** Suspend ou réactive une école. */
  static async setActive(schoolId: string, isActive: boolean) {
    return prisma.school.update({
      where: { id: schoolId },
      data:  { isActive, updatedAt: new Date() },
    });
  }
}

// ─── Erreurs métier ──────────────────────────────────────────────────────────

export class ConflictError extends Error { constructor(msg: string) { super(msg); this.name = "ConflictError"; } }
export class NotFoundError  extends Error { constructor(msg: string) { super(msg); this.name = "NotFoundError"; } }
export class ForbiddenError extends Error { constructor(msg: string) { super(msg); this.name = "ForbiddenError"; } }
