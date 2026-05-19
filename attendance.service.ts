/**
 * TAHFIDZ SaaS — Phase 4 : AttendanceService
 *
 * Fonctionnalités :
 *  - Saisie en lot (toute la classe en 1 appel)
 *  - Rapport mensuel par élève
 *  - Statistiques de présence par classe/période
 *  - Détection des absences répétées (alerte parent)
 */

import { tenantClient } from "@/lib/prisma-tenant";
import { AttendanceStatus } from "@prisma/client";
import { z } from "zod";

// ─── Validation ──────────────────────────────────────────────────────────────

export const BulkAttendanceSchema = z.object({
  classId: z.string().cuid(),
  date:    z.coerce.date(),
  entries: z.array(z.object({
    studentId: z.string().cuid(),
    status:    z.nativeEnum(AttendanceStatus),
    note:      z.string().max(200).optional(),
  })).min(1).max(100),
});

export type BulkAttendanceInput = z.infer<typeof BulkAttendanceSchema>;

const MonthQuerySchema = z.object({
  year:  z.coerce.number().int().min(2020).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

// ─── Service ─────────────────────────────────────────────────────────────────

export class AttendanceService {
  private db: ReturnType<typeof tenantClient>;

  constructor(private schoolId: string) {
    this.db = tenantClient(schoolId);
  }

  /**
   * Saisie en lot : enregistre la présence de toute une classe pour une date.
   * Upsert — peut corriger une saisie déjà faite le même jour.
   */
  async bulkRecord(input: BulkAttendanceInput) {
    const { classId, date, entries } = BulkAttendanceSchema.parse(input);

    // Normaliser la date (minuit UTC)
    const day = new Date(date);
    day.setUTCHours(0, 0, 0, 0);

    const results = await Promise.all(
      entries.map((entry) =>
        this.db.attendance.upsert({
          where: {
            studentId_classId_date: {
              studentId: entry.studentId,
              classId,
              date: day,
            },
          },
          create: {
            studentId: entry.studentId,
            classId,
            date:      day,
            status:    entry.status,
            note:      entry.note,
          },
          update: {
            status: entry.status,
            note:   entry.note,
          },
        })
      )
    );

    // Détection des absences → trigger notification (via job)
    const absentIds = entries
      .filter((e) => e.status === "ABSENT")
      .map((e) => e.studentId);

    if (absentIds.length > 0) {
      // Enqueue job de notification (Phase 5 — BullMQ)
      await this.enqueueAbsenceAlerts(absentIds, classId, day);
    }

    return { recorded: results.length, absentCount: absentIds.length };
  }

  /**
   * Rapport mensuel d'un élève.
   * Retourne { présent, absent, retard, excusé, tauxPresence }
   */
  async monthlyReport(studentId: string, year: number, month: number) {
    const { year: y, month: m } = MonthQuerySchema.parse({ year, month });
    const from = new Date(y, m - 1, 1);
    const to   = new Date(y, m, 0, 23, 59, 59); // dernier jour du mois

    const records = await this.db.attendance.findMany({
      where: {
        studentId,
        date: { gte: from, lte: to },
      },
      orderBy: { date: "asc" },
      include: { class: { select: { name: true } } },
    });

    const counts = {
      PRESENT:  0,
      ABSENT:   0,
      LATE:     0,
      EXCUSED:  0,
    };
    for (const r of records) counts[r.status as keyof typeof counts]++;

    const totalDays   = records.length;
    const presentDays = counts.PRESENT + counts.LATE; // présent même si retard
    const tauxPresence = totalDays > 0
      ? Math.round((presentDays / totalDays) * 100)
      : 100;

    return { studentId, year: y, month: m, counts, totalDays, tauxPresence, records };
  }

  /**
   * Statistiques de présence pour une classe sur une période.
   */
  async classStats(classId: string, from: Date, to: Date) {
    const records = await this.db.attendance.findMany({
      where: { classId, date: { gte: from, lte: to } },
      include: { student: { select: { fullName: true } } },
    });

    // Agréger par élève
    const byStudent = new Map<string, {
      name: string; present: number; absent: number; late: number; excused: number;
    }>();

    for (const r of records) {
      const key = r.studentId;
      if (!byStudent.has(key)) {
        byStudent.set(key, { name: r.student.fullName, present: 0, absent: 0, late: 0, excused: 0 });
      }
      const s = byStudent.get(key)!;
      if (r.status === "PRESENT") s.present++;
      if (r.status === "ABSENT")  s.absent++;
      if (r.status === "LATE")    s.late++;
      if (r.status === "EXCUSED") s.excused++;
    }

    return Array.from(byStudent.entries()).map(([id, data]) => ({
      studentId: id,
      ...data,
      total: data.present + data.absent + data.late + data.excused,
      tauxPresence: data.present + data.absent + data.late + data.excused > 0
        ? Math.round(((data.present + data.late) / (data.present + data.absent + data.late + data.excused)) * 100)
        : 100,
    }));
  }

  /**
   * Élèves avec ≥ N absences consécutives (seuil d'alerte configurable).
   */
  async consecutiveAbsences(classId: string, threshold = 3) {
    const records = await this.db.attendance.findMany({
      where:   { classId, status: "ABSENT" },
      orderBy: [{ studentId: "asc" }, { date: "asc" }],
      include: { student: { select: { fullName: true, guardianPhone: true } } },
    });

    // Compter les séquences consécutives par élève
    const alerts: Array<{ studentId: string; name: string; phone: string | null; streak: number }> = [];
    let prev: { id: string; date: Date } | null = null;
    let streak = 0;

    for (const r of records) {
      if (prev?.id !== r.studentId) { prev = null; streak = 0; }

      const dayDiff = prev
        ? (r.date.getTime() - prev.date.getTime()) / 86_400_000
        : 999;

      streak = dayDiff <= 1 ? streak + 1 : 1;
      prev = { id: r.studentId, date: r.date };

      if (streak === threshold) {
        alerts.push({
          studentId: r.studentId,
          name:      r.student.fullName,
          phone:     r.student.guardianPhone,
          streak,
        });
      }
    }

    return alerts;
  }

  // ── Privé : enqueue job absence (stub — Phase 5) ──────────────────────────

  private async enqueueAbsenceAlerts(studentIds: string[], classId: string, date: Date) {
    // Sera remplacé par bullMQQueue.add("absence-alert", { ... }) en Phase 5
    console.info(`[AttendanceService] ${studentIds.length} absences à notifier — ${date.toISOString()}`);
  }
}
