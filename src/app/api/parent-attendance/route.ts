// src/app/api/parent-attendance/route.ts
// POST: Parent marks attendance for their child
// GET: List attendances marked by the connected parent

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { AttendanceStatus } from "@prisma/client"

const MarkSchema = z.object({
  studentId: z.string().min(1),
  date:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status:    z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
  reason:    z.string().max(500).optional().nullable(),
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
    const parsed = MarkSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { studentId, date, status, reason } = parsed.data

    // Verify parent is linked to student
    const link = await prisma.parentStudentLink.findFirst({
      where: { studentId, parentId: parent.id, isVerified: true },
      include: { student: { include: { user: { select: { schoolId: true, fullName: true } } } } },
    })
    if (!link) {
      return NextResponse.json({ error: "Enfant non lié" }, { status: 403 })
    }

    const dateObj = new Date(date + "T00:00:00Z")

    // Since we don't have @@unique([studentId, date]), use findFirst + create/update
    const existing = await prisma.parentAttendance.findFirst({
      where: { studentId, date: dateObj },
    })

    let attendance
    if (existing) {
      attendance = await prisma.parentAttendance.update({
        where: { id: existing.id },
        data: { status: status as AttendanceStatus, reason: reason ?? null, validatedBy: null, validatedAt: null },
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

    // Notifications on NEW or CHANGED attendance
    const hasChanged = !existing || existing.status !== status
    if (hasChanged) {
      const schoolId = link.student.user.schoolId
      const studentName = link.student.user.fullName

      const statusTitles: Record<string, { fr: string; ar: string; frLabel: string; arLabel: string }> = {
        PRESENT: { fr: "Présence signalée", ar: "حضور مسجل", frLabel: "présent", arLabel: "حاضر" },
        LATE:    { fr: "Retard signalé",    ar: "تأخر مسجل", frLabel: "en retard", arLabel: "متأخر" },
        EXCUSED: { fr: "Absence excusée signalée", ar: "غياب معذور مسجل", frLabel: "absent (excusé)", arLabel: "غائب (معذور)" },
        ABSENT:  { fr: "Absence signalée",  ar: "غياب مسجل", frLabel: "absent", arLabel: "غائب" },
      }
      const st = statusTitles[status] || statusTitles.PRESENT

      // Notify admin ONLY for EXCUSED & ABSENT
      if (status === "EXCUSED" || status === "ABSENT") {
        const admins = await prisma.user.findMany({
          where: { schoolId, role: "ADMIN", isActive: true },
          select: { id: true, schoolId: true },
        })
        if (admins.length > 0) {
          const adminPrefs = await prisma.user.findMany({
            where: { id: { in: admins.map(a => a.id) } },
            select: { id: true, attendanceNotifications: true },
          })
          const enabledAdmins = adminPrefs.filter(u => u.attendanceNotifications !== false)
          if (enabledAdmins.length > 0) {
            await prisma.notification.createMany({
              data: enabledAdmins.map((a) => ({
                schoolId,
                userId: a.id,
                type: "ATTENDANCE_ABSENT_REPORTED",
                title: `${st.fr}: ${studentName}`,
                titleAr: `${st.ar}: ${studentName}`,
                message: `${studentName} marqué ${st.frLabel} le ${date}${reason ? ` — Raison: ${reason}` : ""}`,
                messageAr: `${studentName} مسجل ${st.arLabel} بتاريخ ${date}${reason ? ` — السبب: ${reason}` : ""}`,
                data: { attendanceId: attendance.id, studentId, date, reason, url: `/admin/attendance?studentId=${studentId}&date=${date}` },
              })),
            })
          }
        }
      }

      // Notify teacher for ALL statuses
      const studentWithTeacher = await prisma.student.findUnique({
        where: { id: studentId },
        select: { teacher: { select: { userId: true } } },
      })
      if (studentWithTeacher?.teacher?.userId) {
        const teacherPrefs = await prisma.user.findUnique({
          where: { id: studentWithTeacher.teacher.userId },
          select: { attendanceNotifications: true },
        })
        if (teacherPrefs?.attendanceNotifications !== false) {
          await prisma.notification.create({
            data: {
              schoolId,
              userId: studentWithTeacher.teacher.userId,
              type: "ATTENDANCE_ABSENT_REPORTED",
              title: `${st.fr}: ${studentName}`,
              titleAr: `${st.ar}: ${studentName}`,
              message: `${studentName} marqué ${st.frLabel} le ${date}${reason ? ` — Raison: ${reason}` : ""}`,
              messageAr: `${studentName} مسجل ${st.arLabel} بتاريخ ${date}${reason ? ` — السبب: ${reason}` : ""}`,
              data: { attendanceId: attendance.id, studentId, date, reason, url: `/teacher/attendance?studentId=${studentId}&date=${date}` },
            },
          })
        }
      }
    }

    return NextResponse.json({ message: "Présence enregistrée", attendance }, { status: 201 })
  } catch (error: any) {
    console.error("[PARENT ATTENDANCE POST]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const attendances = await prisma.parentAttendance.findMany({
      where: { parentId: session.user.id },
      include: {
        student: { include: { user: { select: { fullName: true, fullNameAr: true } } } },
      },
      orderBy: { date: "desc" },
      take: 90,
    })

    return NextResponse.json({ attendances })
  } catch (error: any) {
    console.error("[PARENT ATTENDANCE GET]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}
