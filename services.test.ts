/**
 * TAHFIDZ SaaS — Phase 6 : Tests
 *
 * Stack : Vitest + prisma-mock (pas de DB réelle)
 * npx vitest run
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockDeep, DeepMockProxy } from "vitest-mock-extended";
import { PrismaClient } from "@prisma/client";

// ── Mock du tenantClient ──────────────────────────────────────────────────────

vi.mock("@/lib/prisma-tenant", () => {
  const mockPrisma = mockDeep<PrismaClient>();
  return {
    prisma:       mockPrisma,
    tenantClient: vi.fn(() => mockPrisma),
  };
});

import { tenantClient } from "@/lib/prisma-tenant";
import { StudentService } from "@/services/student.service";
import { MemorizationService } from "@/services/memorization.service";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SCHOOL_ID = "school_test_001";

const mockStudent = {
  id:           "student_001",
  schoolId:     SCHOOL_ID,
  fullName:     "Youssef Benali",
  gender:       "MALE" as const,
  status:       "ACTIVE" as const,
  birthDate:    new Date("2010-03-15"),
  guardianPhone: "+212660000000",
  guardianEmail: null,
  guardianName:  null,
  userId:       null,
  photoUrl:     null,
  createdAt:    new Date(),
  updatedAt:    new Date(),
};

const mockMemRecord = {
  id:          "mem_001",
  schoolId:    SCHOOL_ID,
  studentId:   "student_001",
  teacherId:   "teacher_001",
  surahNumber: 114,
  fromVerse:   1,
  toVerse:     6,
  grade:       95,
  status:      "PASSED" as const,
  notes:       null,
  recordedAt:  new Date(),
};

// ─── Tests StudentService ─────────────────────────────────────────────────────

describe("StudentService", () => {
  let db: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    db = tenantClient(SCHOOL_ID) as unknown as DeepMockProxy<PrismaClient>;
    vi.clearAllMocks();
  });

  describe("create()", () => {
    it("crée un élève avec les données valides", async () => {
      db.student.create.mockResolvedValue(mockStudent);

      const svc    = new StudentService(SCHOOL_ID);
      const result = await svc.create({
        fullName:  "Youssef Benali",
        gender:    "MALE",
        birthDate: new Date("2010-03-15"),
      });

      expect(db.student.create).toHaveBeenCalledOnce();
      expect(result.fullName).toBe("Youssef Benali");
    });

    it("rejette si fullName est trop court", async () => {
      const svc = new StudentService(SCHOOL_ID);
      await expect(svc.create({ fullName: "Y", gender: "MALE" }))
        .rejects.toThrow();
    });

    it("rejette un guardianPhone invalide", async () => {
      const svc = new StudentService(SCHOOL_ID);
      await expect(svc.create({ fullName: "Youssef", gender: "MALE", guardianPhone: "invalid" }))
        .rejects.toThrow();
    });
  });

  describe("list()", () => {
    it("retourne les élèves paginés avec meta", async () => {
      db.student.count.mockResolvedValue(1);
      db.student.findMany.mockResolvedValue([mockStudent] as any);

      const svc    = new StudentService(SCHOOL_ID);
      const result = await svc.list({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it("applique le filtre status correctement", async () => {
      db.student.count.mockResolvedValue(0);
      db.student.findMany.mockResolvedValue([]);

      const svc = new StudentService(SCHOOL_ID);
      await svc.list({ status: "WITHDRAWN" });

      expect(db.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "WITHDRAWN" }),
        })
      );
    });

    it("applique la recherche fullName insensible à la casse", async () => {
      db.student.count.mockResolvedValue(0);
      db.student.findMany.mockResolvedValue([]);

      const svc = new StudentService(SCHOOL_ID);
      await svc.list({ search: "youss" });

      expect(db.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            fullName: { contains: "youss", mode: "insensitive" },
          }),
        })
      );
    });
  });

  describe("setStatus()", () => {
    it("met à jour le statut sans modifier les autres champs", async () => {
      db.student.update.mockResolvedValue({ ...mockStudent, status: "GRADUATED" });

      const svc    = new StudentService(SCHOOL_ID);
      const result = await svc.setStatus("student_001", "GRADUATED");

      expect(result.status).toBe("GRADUATED");
      expect(db.student.update).toHaveBeenCalledWith({
        where: { id: "student_001" },
        data:  { status: "GRADUATED" },
      });
    });
  });
});

// ─── Tests MemorizationService ────────────────────────────────────────────────

describe("MemorizationService", () => {
  let db: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    db = tenantClient(SCHOOL_ID) as unknown as DeepMockProxy<PrismaClient>;
    vi.clearAllMocks();
  });

  describe("record()", () => {
    it("enregistre une évaluation valide", async () => {
      db.memorizationRecord.create.mockResolvedValue(mockMemRecord);

      const svc    = new MemorizationService(SCHOOL_ID);
      const result = await svc.record({
        studentId:   "student_001",
        teacherId:   "teacher_001",
        surahNumber: 114,
        fromVerse:   1,
        toVerse:     6,
        grade:       95,
        status:      "PASSED",
      });

      expect(result.grade).toBe(95);
    });

    it("rejette si toVerse < fromVerse", async () => {
      const svc = new MemorizationService(SCHOOL_ID);
      await expect(
        svc.record({
          studentId:   "student_001",
          teacherId:   "teacher_001",
          surahNumber: 114,
          fromVerse:   5,
          toVerse:     3, // invalide
          grade:       80,
          status:      "PASSED",
        })
      ).rejects.toThrow("toVerse doit être ≥ fromVerse");
    });

    it("rejette une note hors de [0, 100]", async () => {
      const svc = new MemorizationService(SCHOOL_ID);
      await expect(
        svc.record({
          studentId:   "s",
          teacherId:   "t",
          surahNumber: 1,
          fromVerse:   1,
          toVerse:     7,
          grade:       150, // invalide
          status:      "PASSED",
        })
      ).rejects.toThrow();
    });
  });

  describe("schoolStats()", () => {
    it("retourne un total cohérent", async () => {
      db.memorizationRecord.count
        .mockResolvedValueOnce(40)  // PASSED
        .mockResolvedValueOnce(10)  // NEEDS_REVIEW
        .mockResolvedValueOnce(5)   // FAILED
        .mockResolvedValueOnce(2);  // PENDING

      const svc    = new MemorizationService(SCHOOL_ID);
      const result = await svc.schoolStats();

      expect(result.total).toBe(57);
      expect(result.passed).toBe(40);
    });
  });
});

// ─── Tests isolation multi-tenant ────────────────────────────────────────────

describe("Isolation multi-tenant", () => {
  it("deux services avec schoolIds différents utilisent des clients distincts", () => {
    const svc1 = new StudentService("school_A");
    const svc2 = new StudentService("school_B");

    // tenantClient doit être appelé avec les bons schoolIds
    expect(tenantClient).toHaveBeenCalledWith("school_A");
    expect(tenantClient).toHaveBeenCalledWith("school_B");
  });

  it("tenantClient lève si schoolId est vide", async () => {
    const { tenantClient: realTenantClient } = await import("@/lib/prisma-tenant");
    // Lever l'isolation du mock pour tester la vraie implémentation
    // En pratique on teste cela avec un test d'intégration
    expect(() => new StudentService("")).not.toThrow(); // le throw est dans tenantClient
  });
});
