// src/app/api/memorization/progress/route.ts
// PATCH: Student or Parent updates memorization progress

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { ProgressQuality, MemorizationStatus } from "@prisma/client"

const ProgressSchema = z.object({
  assignmentId: z.string().min(1),
  versesMemorized: z.number().int().min(0),
  quality: z.enum(["EXCELLENT", "GOOD", "NEEDS_WORK", "POOR"]),
  notes: z.string().max(500).optional().nullable(),
})

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || !["STUDENT", "PARENT"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const body = await req.json()
    const parsed = ProgressSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { assignmentId, versesMemorized, quality, notes } = parsed.data

    // Verify assignment exists
    const assignment = await prisma.memorizationProgress.findUnique({
      where: { id: assignmentId },
      include: {
        student: { include: { user: { select: { id: true, schoolId: true, fullName: true } } } },
        surah: { select: { nameFr: true, nameAr: true, verseCount: true } },
        teacher: { include: { user: { select: { id: true } } } },
      },
    })
    if (!assignment) {
      return NextResponse.json({ error: "Assignation introuvable" }, { status: 404 })
    }

    // Authorization check
    if (session.user.role === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })
      if (!student || student.id !== assignment.studentId) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
      }
    } else if (session.user.role === "PARENT") {
      const link = await prisma.parentStudentLink.findFirst({
        where: { studentId: assignment.studentId, parent: { userId: session.user.id } },
      })
      if (!link) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
      }
    }

    const totalVerses = assignment.versesTo ?? assignment.endVerse ?? assignment.surah.verseCount
    const fromVerse = assignment.versesFrom ?? assignment.startVerse ?? 1
    const percentage = Math.min(100, Math.round((versesMemorized / (totalVerses - fromVerse + 1)) * 100))

    // Determine new status
    let newStatus: MemorizationStatus = assignment.status
    if (percentage >= 100) newStatus = "MEMORIZED"
    else if (percentage > 0) newStatus = "IN_PROGRESS"

    // Update assignment
    const updated = await prisma.memorizationProgress.update({
      where: { id: assignmentId },
      data: {
        currentVerse: fromVerse + versesMemorized,
        completionPercentage: percentage,
        status: newStatus,
        revisionCount: { increment: 1 },
        lastRevisedAt: new Date(),
        notes: notes ?? assignment.notes,
      },
    })

    // Create status history
    await prisma.statusHistory.create({
      data: {
        progressId: assignmentId,
        oldStatus: assignment.status,
        newStatus,
        changedBy: session.user.id,
        versesMemorized,
        quality: quality as ProgressQuality,
        note: notes ?? undefined,
      },
    })

    // Notify teacher
    if (assignment.teacher?.user?.id) {
      await prisma.notification.create({
        data: {
          schoolId: assignment.student.user.schoolId,
          userId: assignment.teacher.user.id,
          type: "MEMORIZATION_PROGRESS_UPDATED",
          title: `Progression: ${assignment.student.user.fullName}`,
          titleAr: `تقدم: ${assignment.student.user.fullName}`,
          message: `${assignment.student.user.fullName} a mémorisé ${versesMemorized} versets de ${assignment.surah.nameFr}`,
          messageAr: `حفظ ${assignment.student.user.fullName} ${versesMemorized} آيات من ${assignment.surah.nameAr}`,
          data: { assignmentId, versesMemorized, percentage },
        },
      })
    }

    // Notify parents (if updated by student) or student (if updated by parent)
    const parentLinks = await prisma.parentStudentLink.findMany({
      where: { studentId: assignment.studentId, isVerified: true },
      include: { parent: { include: { user: { select: { id: true, schoolId: true } } } } },
    })

    const updaterRole = session.user.role
    const targetUsers = updaterRole === "STUDENT"
      ? parentLinks.map((l) => l.parent.user)
      : [{ id: assignment.student.user.id, schoolId: assignment.student.user.schoolId }]

    if (targetUsers.length > 0) {
      await prisma.notification.createMany({
        data: targetUsers.map((u) => ({
          schoolId: u.schoolId,
          userId: u.id,
          type: updaterRole === "STUDENT" ? "MEMORIZATION_PROGRESS_UPDATED" : "MEMORIZATION_PROGRESS_BY_PARENT",
          title: `Progression ${assignment.surah.nameFr}: ${percentage}%`,
          titleAr: `تقدم ${assignment.surah.nameAr}: ${percentage}%`,
          message: `${versesMemorized}/${totalVerses} versets — Qualité: ${quality}`,
          messageAr: `${versesMemorized}/${totalVerses} آيات — الجودة: ${quality}`,
          data: { assignmentId, versesMemorized, percentage, quality },
        })),
      })
    }

    return NextResponse.json({ message: "Progression mise à jour", assignment: updated })
  } catch (error: any) {
    console.error("[MEMORIZATION PROGRESS]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}
