/**
 * TAHFIDZ SaaS — MemorizationService
 *
 * Cœur métier : saisie des évaluations de mémorisation,
 * calcul de progression par sourate, statistiques enseignant.
 */

import { tenantClient } from "@/lib/prisma-tenant";
import { MemStatus } from "@prisma/client";
import { z } from "zod";

// ─── Validation ──────────────────────────────────────────────────────────────

export const RecordMemorizationSchema = z.object({
  studentId:   z.string().cuid(),
  teacherId:   z.string().cuid(),
  surahNumber: z.number().int().min(1).max(114),
  fromVerse:   z.number().int().min(1).default(1),
  toVerse:     z.number().int().min(1),
  grade:       z.number().int().min(0).max(100),
  status:      z.nativeEnum(MemStatus),
  notes:       z.string().max(500).optional(),
}).refine((d) => d.toVerse >= d.fromVerse, {
  message: "toVerse doit être ≥ fromVerse",
  path: ["toVerse"],
});

export type RecordMemorizationInput = z.infer<typeof RecordMemorizationSchema>;

// ─── Service ─────────────────────────────────────────────────────────────────

export class MemorizationService {
  private db: ReturnType<typeof tenantClient>;

  constructor(private schoolId: string) {
    this.db = tenantClient(schoolId);
  }

  /** Enregistre une évaluation de mémorisation. */
  async record(input: RecordMemorizationInput) {
    const data = RecordMemorizationSchema.parse(input);

    // Vérifier que la sourate existe dans le référentiel
    const surah = await this.db.$extends({}).surahRef?.findUnique({
      where: { number: data.surahNumber },
    });

    return this.db.memorizationRecord.create({ data });
  }

  /**
   * Progression d'un élève : versets mémorisés par sourate (PASSED uniquement).
   * Retourne un tableau { surahNumber, nameFr, versesMemorized, totalVerses, pct }.
   */
  async studentProgress(studentId: string) {
    const records = await this.db.memorizationRecord.findMany({
      where:   { studentId, status: "PASSED" },
      include: { surah: true },
      orderBy: { surahNumber: "asc" },
    });

    // Agréger par sourate : sommer les versets uniques (simplification : on additionne les plages)
    const map = new Map<number, { surah: typeof records[0]["surah"]; verses: number }>();
    for (const r of records) {
      const versesInRecord = r.toVerse - r.fromVerse + 1;
      const existing = map.get(r.surahNumber);
      if (existing) {
        existing.verses += versesInRecord;
      } else {
        map.set(r.surahNumber, { surah: r.surah, verses: versesInRecord });
      }
    }

    return Array.from(map.values()).map(({ surah, verses }) => ({
      surahNumber:     surah.number,
      nameFr:          surah.nameFr,
      nameAr:          surah.nameAr,
      versesMemorized: Math.min(verses, surah.totalVerses),
      totalVerses:     surah.totalVerses,
      pct:             Math.min(100, Math.round((verses / surah.totalVerses) * 100)),
    }));
  }

  /** Historique des évaluations d'un élève (paginé). */
  async studentHistory(
    studentId: string,
    opts: { page?: number; limit?: number } = {}
  ) {
    const page  = opts.page  ?? 1;
    const limit = opts.limit ?? 20;

    return this.db.memorizationRecord.findMany({
      where:   { studentId },
      orderBy: { recordedAt: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
      include: {
        surah:   { select: { nameFr: true, nameAr: true } },
        teacher: { select: { fullName: true } },
      },
    });
  }

  /**
   * Tableau de bord enseignant : ses élèves et leur dernière évaluation.
   */
  async teacherDashboard(teacherId: string) {
    const records = await this.db.memorizationRecord.findMany({
      where:   { teacherId },
      orderBy: { recordedAt: "desc" },
      distinct: ["studentId"],
      include: {
        student: { select: { id: true, fullName: true } },
        surah:   { select: { nameFr: true } },
      },
    });

    return records.map((r) => ({
      studentId:   r.student.id,
      studentName: r.student.fullName,
      lastSurah:   r.surah.nameFr,
      lastGrade:   r.grade,
      lastStatus:  r.status,
      lastDate:    r.recordedAt,
    }));
  }

  /**
   * Stats école : répartition des statuts sur les 30 derniers jours.
   */
  async schoolStats() {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [passed, needsReview, failed, pending] = await Promise.all([
      this.db.memorizationRecord.count({ where: { status: "PASSED",       recordedAt: { gte: since } } }),
      this.db.memorizationRecord.count({ where: { status: "NEEDS_REVIEW", recordedAt: { gte: since } } }),
      this.db.memorizationRecord.count({ where: { status: "FAILED",       recordedAt: { gte: since } } }),
      this.db.memorizationRecord.count({ where: { status: "PENDING",      recordedAt: { gte: since } } }),
    ]);

    return { passed, needsReview, failed, pending, total: passed + needsReview + failed + pending };
  }
}
