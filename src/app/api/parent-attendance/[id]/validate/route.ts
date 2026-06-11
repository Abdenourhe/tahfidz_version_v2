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
      if (parentUser?.attendanceNotifications !== false) {
        await prisma.notification.create({
          data: {
            schoolId: attendance.student.user.schoolId,
            userId: attendance.parentId,
            type: "ATTENDANCE_REJECTED",
            title: `Absence rejetée: ${attendance.student.user.fullName}`,
            titleAr: `تم رفض الغياب: ${attendance.student.user.fullName}`,
            message: `Le ${attendance.date.toLocaleDateString("fr-FR")} — votre signalement d'absence pour ${attendance.student.user.fullName} a été rejeté par le professeur.${rejectionReason ? ` Motif: ${rejectionReason}` : ""}`,
            messageAr: `بتاريخ ${attendance.date.toLocaleDateString("fr-FR")} — تم رفض بلاغ الغياب لـ ${attendance.student.user.fullName} من قبل المعلم.${rejectionReason ? ` السبب: ${rejectionReason}` : ""}`,
            data: { attendanceId: id, validated: false, rejectionReason: rejectionReason || null, url: "/parent/attendance" },
          },
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
            title: `Présence validée: ${attendance.student.user.fullName}`,
            titleAr: `تم التحقق من الحضور: ${attendance.student.user.fullName}`,
            message: `Le ${attendance.date.toLocaleDateString("fr-FR")} — statut ${attendance.status} validé par le professeur`,
            messageAr: `بتاريخ ${attendance.date.toLocaleDateString("fr-FR")} — الحالة ${attendance.status} تم التحقق منها من قبل المعلم`,
            data: { attendanceId: id, validated: true, url: "/parent/attendance" },
          },
        })
      }
    }

    return NextResponse.json({ message: "Validation enregistrée", attendance: updated })
  } catch (error: any) {
    console.error("[ATTENDANCE VALIDATE]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}
