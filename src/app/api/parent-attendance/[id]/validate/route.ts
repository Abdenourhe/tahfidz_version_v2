// src/app/api/parent-attendance/[id]/validate/route.ts
// PATCH: Teacher validates or rejects a parent-marked attendance

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { validated, rejectionReason } = body as { validated: boolean; rejectionReason?: string }

    const attendance = await prisma.parentAttendance.findUnique({
      where: { id },
      include: {
        student: { include: { user: { select: { schoolId: true, fullName: true } }, teacher: { select: { userId: true } } } },
        parent: { select: { id: true, schoolId: true } },
      },
    })
    if (!attendance) {
      return NextResponse.json({ error: "Présence introuvable" }, { status: 404 })
    }

    // Verify teacher is assigned to this student
    if (attendance.student.teacher?.userId !== session.user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const wasAlreadyValidated = !!attendance.validatedAt

    if (!validated) {
      /* ── REJECTION: delete the parent attendance record ── */
      await prisma.parentAttendance.delete({ where: { id } })

      // Notify parent of rejection
      const parentUser = await prisma.user.findUnique({
        where: { id: attendance.parentId },
        select: { attendanceNotifications: true },
      })
      const safeDate = new Date(attendance.date.toISOString().slice(0, 10) + "T12:00:00").toLocaleDateString("fr-FR")
      if (parentUser?.attendanceNotifications !== false) {
        await prisma.notification.create({
          data: {
            schoolId: attendance.student.user.schoolId,
            userId: attendance.parentId,
            type: "ATTENDANCE_REJECTED",
            title: `Absence rejetée: ${attendance.student.user.fullName}`,
            titleAr: `تم رفض الغياب: ${attendance.student.user.fullName}`,
            message: `Le ${safeDate} — votre signalement d'absence pour ${attendance.student.user.fullName} a été rejeté par le professeur.${rejectionReason ? ` Motif: ${rejectionReason}` : ""}`,
            messageAr: `بتاريخ ${safeDate} — تم رفض بلاغ الغياب لـ ${attendance.student.user.fullName} من قبل المعلم.${rejectionReason ? ` السبب: ${rejectionReason}` : ""}`,
            data: { attendanceId: id, validated: false, rejectionReason: rejectionReason || null, url: "/parent/attendance" },
          },
        })
      }

      // Notify admin of rejection
      const admins = await prisma.user.findMany({
        where: { schoolId: attendance.student.user.schoolId, role: "ADMIN", isActive: true },
        select: { id: true, attendanceNotifications: true },
      })
      const enabledAdmins = admins.filter(a => a.attendanceNotifications !== false)
      if (enabledAdmins.length > 0) {
        await prisma.notification.createMany({
          data: enabledAdmins.map(a => ({
            schoolId: attendance.student.user.schoolId,
            userId: a.id,
            type: "ATTENDANCE_REJECTED",
            title: `Absence rejetée: ${attendance.student.user.fullName}`,
            titleAr: `تم رفض الغياب: ${attendance.student.user.fullName}`,
            message: `Le ${safeDate} — le signalement d'absence de ${attendance.student.user.fullName} a été rejeté par le professeur.${rejectionReason ? ` Motif: ${rejectionReason}` : ""}`,
            messageAr: `بتاريخ ${safeDate} — تم رفض بلاغ الغياب لـ ${attendance.student.user.fullName} من قبل المعلم.${rejectionReason ? ` السبب: ${rejectionReason}` : ""}`,
            data: { attendanceId: id, validated: false, rejectionReason: rejectionReason || null, url: `/admin/attendance?studentId=${attendance.studentId}&date=${attendance.date.toISOString().slice(0, 10)}` },
          })),
        })
      }

      return NextResponse.json({ message: "Absence rejetée et supprimée" })
    }

    /* ── VALIDATION: normal flow ── */
    const isStateChanging = validated !== wasAlreadyValidated

    const updated = await prisma.parentAttendance.update({
      where: { id },
      data: {
        validatedBy: session.user.id,
        validatedAt: new Date(),
      },
    })

    if (isStateChanging) {
      const safeDate = new Date(attendance.date.toISOString().slice(0, 10) + "T12:00:00").toLocaleDateString("fr-FR")
      const statusLabels: Record<string, { fr: string; ar: string; frValid: string }> = {
        PRESENT: { fr: "Présence", ar: "الحضور", frValid: "validée" },
        LATE:    { fr: "Retard",    ar: "التأخر",  frValid: "validé" },
        EXCUSED: { fr: "Absence excusée", ar: "الغياب المعذور", frValid: "validée" },
        ABSENT:  { fr: "Absence",   ar: "الغياب",  frValid: "validée" },
      }
      const lab = statusLabels[attendance.status] || statusLabels.PRESENT
      const statusLabelFr = lab.fr
      const statusLabelAr = lab.ar
      const statusVerbFr = lab.frValid
      const statusVerbAr = "تم التحقق منه"

      // Notify parent
      const parentUser = await prisma.user.findUnique({
        where: { id: attendance.parentId },
        select: { attendanceNotifications: true },
      })
      if (parentUser?.attendanceNotifications !== false) {
        await prisma.notification.create({
          data: {
            schoolId: attendance.student.user.schoolId,
            userId: attendance.parentId,
            type: "ATTENDANCE_VALIDATED",
            title: `${statusLabelFr} ${statusVerbFr}: ${attendance.student.user.fullName}`,
            titleAr: `${statusVerbAr}: ${attendance.student.user.fullName}`,
            message: `Le ${safeDate} — ${statusLabelFr.toLowerCase()} de ${attendance.student.user.fullName} a été ${statusVerbFr} par le professeur`,
            messageAr: `بتاريخ ${safeDate} — ${statusLabelAr} لـ ${attendance.student.user.fullName} تم التحقق منه من قبل المعلم`,
            data: { attendanceId: id, validated: true, url: "/parent/attendance" },
          },
        })
      }

      // Notify admin of validation
      const admins = await prisma.user.findMany({
        where: { schoolId: attendance.student.user.schoolId, role: "ADMIN", isActive: true },
        select: { id: true, attendanceNotifications: true },
      })
      const enabledAdmins = admins.filter(a => a.attendanceNotifications !== false)
      if (enabledAdmins.length > 0) {
        await prisma.notification.createMany({
          data: enabledAdmins.map(a => ({
            schoolId: attendance.student.user.schoolId,
            userId: a.id,
            type: "ATTENDANCE_VALIDATED",
            title: `${statusLabelFr} ${statusVerbFr}: ${attendance.student.user.fullName}`,
            titleAr: `${statusVerbAr}: ${attendance.student.user.fullName}`,
            message: `Le ${safeDate} — ${statusLabelFr.toLowerCase()} de ${attendance.student.user.fullName} a été ${statusVerbFr} par le professeur`,
            messageAr: `بتاريخ ${safeDate} — ${statusLabelAr} لـ ${attendance.student.user.fullName} تم التحقق منه من قبل المعلم`,
            data: { attendanceId: id, validated: true, url: `/admin/attendance?studentId=${attendance.studentId}&date=${attendance.date.toISOString().slice(0, 10)}` },
          })),
        })
      }
    }

    return NextResponse.json({ message: "Validation enregistrée", attendance: updated })
  } catch (error: any) {
    console.error("[ATTENDANCE VALIDATE]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}
