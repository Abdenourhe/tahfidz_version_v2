/**
 * TAHFIDZ SaaS — StudentService
 *
 * Toutes les opérations sur les élèves sont scopées par schoolId
 * via le tenantClient — impossible d'accéder aux données d'une autre école.
 */

import { tenantClient } from "@/lib/prisma-tenant";
import { Gender, StudentStatus } from "@prisma/client";
import { z } from "zod";

// ─── Validation ──────────────────────────────────────────────────────────────

export const CreateStudentSchema = z.object({
  fullName:      z.string().min(2).max(100),
  gender:        z.nativeEnum(Gender),
  birthDate:     z.coerce.date().optional(),
  guardianName:  z.string().max(100).optional(),
  guardianPhone: z.string().regex(/^\+?\d{8,15}$/).optional(),
  guardianEmail: z.string().email().optional(),
  photoUrl:      z.string().url().optional(),
});

export type CreateStudentInput = z.infer<typeof CreateStudentSchema>;

export const ListStudentsSchema = z.object({
  search:  z.string().optional(),
  status:  z.nativeEnum(StudentStatus).optional(),
  classId: z.string().cuid().optional(),
  page:    z.coerce.number().int().min(1).default(1),
  limit:   z.coerce.number().int().min(1).max(100).default(20),
});

export type ListStudentsInput = z.infer<typeof ListStudentsSchema>;

// ─── Service ─────────────────────────────────────────────────────────────────

export class StudentService {
  private db: ReturnType<typeof tenantClient>;

  constructor(private schoolId: string) {
    this.db = tenantClient(schoolId);
  }

  /** Crée un élève dans l'école du contexte. */
  async create(input: CreateStudentInput) {
    const data = CreateStudentSchema.parse(input);
    return this.db.student.create({ data });
  }

  /** Liste les élèves avec filtres et pagination. */
  async list(input: ListStudentsInput = {}) {
    const { search, status, classId, page, limit } =
      ListStudentsSchema.parse(input);

    const where = {
      ...(status && { status }),
      ...(search && {
        fullName: { contains: search, mode: "insensitive" as const },
      }),
      ...(classId && {
        enrollments: { some: { classId, status: "ACTIVE" } },
      }),
    };

    const [total, items] = await Promise.all([
      this.db.student.count({ where }),
      this.db.student.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { fullName: "asc" },
        include: {
          enrollments: {
            where:   { status: "ACTIVE" },
            include: { class: { select: { name: true } } },
          },
          _count: {
            select: { memorizationRecords: true, payments: true },
          },
        },
      }),
    ]);

    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /** Charge un élève par id (vérifie l'appartenance à l'école via tenantClient). */
  async findById(id: string) {
    const student = await this.db.student.findFirst({
      where: { id },
      include: {
        enrollments: {
          include: { class: { select: { name: true, teacher: { select: { fullName: true } } } } },
        },
        memorizationRecords: {
          orderBy: { recordedAt: "desc" },
          take: 10,
          include: { surah: true },
        },
        payments: {
          orderBy: { paidAt: "desc" },
          take: 6,
          include: { fee: { select: { label: true, period: true } } },
        },
      },
    });
    if (!student) throw new Error("Élève introuvable");
    return student;
  }

  /** Met à jour les informations d'un élève. */
  async update(id: string, input: Partial<CreateStudentInput>) {
    const data = CreateStudentSchema.partial().parse(input);
    return this.db.student.update({ where: { id }, data });
  }

  /** Change le statut (suspension, graduation…). */
  async setStatus(id: string, status: StudentStatus) {
    return this.db.student.update({ where: { id }, data: { status } });
  }

  /** Tableau de bord : statistiques rapides de l'école. */
  async stats() {
    const [total, active, graduated, withdrawn] = await Promise.all([
      this.db.student.count(),
      this.db.student.count({ where: { status: "ACTIVE" } }),
      this.db.student.count({ where: { status: "GRADUATED" } }),
      this.db.student.count({ where: { status: "WITHDRAWN" } }),
    ]);
    return { total, active, graduated, withdrawn };
  }
}
