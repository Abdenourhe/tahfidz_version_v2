// src/app/api/parent-attendance/[id]/validate/route.ts
// PATCH: Teacher validates a parent-marked attendance

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
    const { validated } = body as { validated: boolean }

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

    const updated = await prisma.parentAttendance.update({
      where: { id },
      data: {
        validatedBy: validated ? session.user.id : null,
        validatedAt: validated ? new Date() : null,
      },
    })

    // Notify parent
    await prisma.notification.create({
      data: {
        schoolId: attendance.student.user.schoolId,
        userId: attendance.parentId,
        type: "ATTENDANCE_VALIDATED",
        title: `Présence validée: ${attendance.student.user.fullName}`,
        titleAr: `تم التحقق من الحضور: ${attendance.student.user.fullName}`,
        message: `Le ${attendance.date.toLocaleDateString("fr-FR")} — statut ${attendance.status} ${validated ? "validé" : "rejeté"} par le professeur`,
        messageAr: `بتاريخ ${attendance.date.toLocaleDateString("fr-FR")} — الحالة ${attendance.status} ${validated ? "تم التحقق" : "مرفوضة"} من قبل المعلم`,
        data: { attendanceId: id, validated },
      },
    })

    return NextResponse.json({ message: "Validation mise à jour", attendance: updated })
  } catch (error: any) {
    console.error("[ATTENDANCE VALIDATE]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}
