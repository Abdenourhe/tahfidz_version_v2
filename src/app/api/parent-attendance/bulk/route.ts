// src/app/api/parent-attendance/bulk/route.ts
// POST: Parent marks attendance for multiple children at once

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { AttendanceStatus } from "@prisma/client"

const BulkMarkSchema = z.object({
  records: z.array(
    z.object({
      studentId: z.string().min(1),
      date:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      status:    z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
      reason:    z.string().max(500).optional().nullable(),
    })
  ).min(1).max(50),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!parent) {
      return NextResponse.json({ error: "Parent introuvable" }, { status: 404 })
    }

    const body = await req.json()
    const parsed = BulkMarkSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { records } = parsed.data

    // Vérifier que tous les studentId appartiennent au parent
    const links = await prisma.parentStudentLink.findMany({
      where: { parentId: parent.id, isVerified: true },
      include: {
        student: {
          include: {
            user: { select: { schoolId: true, fullName: true } },
            teacher: { include: { user: { select: { id: true } } } },
          },
        },
      },
    })
    const linkMap = new Map(links.map(l => [l.studentId, l]))

    const invalid = records.find(r => !linkMap.has(r.studentId))
    if (invalid) {
      return NextResponse.json({ error: "Enfant non lié" }, { status: 403 })
    }

    // Vérifier que toutes les dates sont aujourd'hui ou à venir
    const todayNormalized = new Date()
    todayNormalized.setHours(0, 0, 0, 0)
    const yesterday = new Date(todayNormalized)
    yesterday.setDate(yesterday.getDate() - 1)

    for (const record of records) {
      const dateObj = new Date(record.date + "T00:00:00Z")
      if (dateObj <= yesterday) {
        return NextResponse.json(
          { error: `Vous ne pouvez signaler la présence que pour aujourd'hui ou les jours à venir (${record.date})` },
          { status: 403 }
        )
      }
    }

    const statusTitles: Record<string, { fr: string; ar: string; frLabel: string; arLabel: string }> = {
      PRESENT: { fr: "Présence signalée", ar: "حضور مسجل", frLabel: "présent", arLabel: "حاضر" },
      LATE:    { fr: "Retard signalé",    ar: "تأخر مسجل", frLabel: "en retard", arLabel: "متأخر" },
      EXCUSED: { fr: "Absence excusée signalée", ar: "غياب معذور مسجل", frLabel: "absent (excusé)", arLabel: "غائب (معذور)" },
      ABSENT:  { fr: "Absence signalée",  ar: "غياب مسجل", frLabel: "absent", arLabel: "غائب" },
    }

    const results: any[] = []
    const adminNotifications: any[] = []
    const teacherNotifications: any[] = []

    for (const record of records) {
      const { studentId, date, status, reason } = record
      const link = linkMap.get(studentId)!
      const schoolId = link.student.user.schoolId
      const studentName = link.student.user.fullName
      const dateObj = new Date(date + "T00:00:00Z")

      const existing = await prisma.parentAttendance.findFirst({
        where: { studentId, date: dateObj },
      })

      let attendance
      if (existing) {
        attendance = await prisma.parentAttendance.update({
          where: { id: existing.id },
          data: {
            status: status as AttendanceStatus,
            reason: reason ?? null,
            validatedBy: null,
            validatedAt: null,
          },
        })
      } else {
        attendance = await prisma.parentAttendance.create({
          data: {
            studentId,
            parentId: session.user.id,
            date: dateObj,
            status: status as AttendanceStatus,
            reason: reason ?? null,
          },
        })
      }

      results.push(attendance)

      const hasChanged = !existing || existing.status !== status
      if (!hasChanged) continue

      const st = statusTitles[status]

      // Admin notifications (ABSENT/EXCUSED only)
      if (status === "EXCUSED" || status === "ABSENT") {
        const admins = await prisma.user.findMany({
          where: { schoolId, role: "ADMIN", isActive: true },
          select: { id: true, attendanceNotifications: true },
        })
        admins
          .filter(a => a.attendanceNotifications !== false)
          .forEach(a => {
            adminNotifications.push({
              schoolId,
              userId: a.id,
              type: "ATTENDANCE_ABSENT_REPORTED",
              title: `${st.fr}: ${studentName}`,
              titleAr: `${st.ar}: ${studentName}`,
              message: `${studentName} marqué ${st.frLabel} le ${date}${reason ? ` — Raison: ${reason}` : ""}`,
              messageAr: `${studentName} مسجل ${st.arLabel} بتاريخ ${date}${reason ? ` — السبب: ${reason}` : ""}`,
              data: { attendanceId: attendance.id, studentId, date, reason, url: `/admin/attendance?studentId=${studentId}&date=${date}` },
            })
          })
      }

      // Teacher notification for LATE / ABSENT / EXCUSED only
      if (status !== "PRESENT") {
        const teacherUserId = link.student.teacher?.user?.id
        if (teacherUserId) {
          const teacherPrefs = await prisma.user.findUnique({
            where: { id: teacherUserId },
            select: { attendanceNotifications: true, presenceNotifications: true },
          })
          const notifKey = status === "LATE" ? "presenceNotifications" : "attendanceNotifications"
          if (teacherPrefs?.[notifKey] !== false) {
            teacherNotifications.push({
              schoolId,
              userId: teacherUserId,
              type: "ATTENDANCE_ABSENT_REPORTED",
              title: `${st.fr}: ${studentName}`,
              titleAr: `${st.ar}: ${studentName}`,
              message: `${studentName} marqué ${st.frLabel} le ${date}${reason ? ` — Raison: ${reason}` : ""}`,
              messageAr: `${studentName} مسجل ${st.arLabel} بتاريخ ${date}${reason ? ` — السبب: ${reason}` : ""}`,
              data: { attendanceId: attendance.id, studentId, date, reason, url: `/teacher/attendance?studentId=${studentId}&date=${date}` },
            })
          }
        }
      }
    }

    if (adminNotifications.length > 0) {
      await prisma.notification.createMany({ data: adminNotifications })
    }
    if (teacherNotifications.length > 0) {
      await prisma.notification.createMany({ data: teacherNotifications })
    }

    return NextResponse.json({
      message: `${results.length} présence${results.length > 1 ? "s" : ""} enregistrée${results.length > 1 ? "s" : ""}`,
      count: results.length,
      attendances: results,
    }, { status: 201 })
  } catch (error: any) {
    console.error("[PARENT ATTENDANCE BULK POST]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}
