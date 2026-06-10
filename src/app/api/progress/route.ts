// src/app/api/progress/route.ts
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { progressUpdateSchema } from "@/lib/validations/auth"
import { calcProgress } from "@/lib/utils"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const studentId    = searchParams.get("studentId")
  const statusFilter = searchParams.get("status") // e.g. READY_FOR_RECITATION

  // Teacher/Admin: can see all pending versets across their students
  if (!studentId && ["TEACHER","ADMIN"].includes(session.user.role) && statusFilter) {
    const teacher = session.user.role === "TEACHER"
      ? await prisma.teacher.findUnique({ where: { userId: session.user.id } })
      : null

    const where: Record<string,unknown> = { status: statusFilter }
    if (teacher) where.student = { teacherId: teacher.id }
    if (session.user.role === "ADMIN") where.student = { ...(where.student as object || {}), user: { schoolId: session.user.schoolId } }

    const progress = await prisma.memorizationProgress.findMany({
      where,
      include: {
        surah: true,
        student: { include: { user: { select: { fullName: true } } } },
      },
      orderBy: { updatedAt: "asc" },
    })
    return NextResponse.json({ progress })
  }

  let targetStudentId = studentId

  if (session.user.role === "STUDENT") {
    const student = await prisma.student.findUnique({ where: { userId: session.user.id } })
    targetStudentId = student?.id ?? null
  }

  // PARENT: verify they own this child
  if (session.user.role === "PARENT" && targetStudentId) {
    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: { childrenLinks: { where: { isVerified: true }, select: { studentId: true } } },
    })
    const isChild = parent?.childrenLinks.some(l => l.studentId === targetStudentId)
    if (!isChild) return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
  }

  if (!targetStudentId && session.user.role !== "PARENT") {
    return NextResponse.json({ error: "studentId requis" }, { status: 400 })
  }

  const where: Record<string,unknown> = { studentId: targetStudentId }
  if (statusFilter) where.status = statusFilter

  const progress = await prisma.memorizationProgress.findMany({
    where,
    include: {
      surah: true,
      evaluation: { select: { finalScore: true, decision: true, evaluatedAt: true } },
      statusHistory: { orderBy: { changedAt: "desc" }, take: 3 },
    },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json({ progress })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "TEACHER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = progressUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { studentId, surahId, status, currentVerse, note } = parsed.data

  // Teacher can only assign/update progress for their own students
  if (session.user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } })
    if (!teacher) return NextResponse.json({ error: "Profil enseignant introuvable" }, { status: 404 })
    const targetStudent = await prisma.student.findUnique({
      where: { id: studentId }, select: { teacherId: true },
    })
    if (!targetStudent) return NextResponse.json({ error: "Élève introuvable" }, { status: 404 })
    if (targetStudent.teacherId !== teacher.id) {
      return NextResponse.json({ error: "Vous ne pouvez gérer que vos propres élèves" }, { status: 403 })
    }
  }

  const surah = await prisma.surah.findUnique({ where: { id: surahId } })
  if (!surah) return NextResponse.json({ error: "Sourate introuvable" }, { status: 404 })

  // Chercher une progression existante
  const existing = await prisma.memorizationProgress.findFirst({
    where: { studentId, surahId, status: { not: "MEMORIZED" } },
  })

  if (existing) {
    // Mise à jour
    const completionPercentage = currentVerse
      ? calcProgress(currentVerse, surah.verseCount)
      : existing.completionPercentage

    const updated = await prisma.memorizationProgress.update({
      where: { id: existing.id },
      data: {
        status,
        currentVerse: currentVerse ?? existing.currentVerse,
        completionPercentage,
        completedAt: status === "MEMORIZED" ? new Date() : null,
        statusHistory: {
          create: {
            oldStatus: existing.status,
            newStatus: status,
            changedBy: session.user.id,
            note,
          },
        },
      },
    })

    // Notifier l'élève si validé
    if (status === "MEMORIZED") {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { user: true },
      })
      if (student) {
        const studentPrefs = await prisma.user.findUnique({
          where: { id: student.userId },
          select: { evaluationNotifications: true },
        })
        if (studentPrefs?.evaluationNotifications !== false) {
          await prisma.notification.create({
            data: {
              schoolId: session.user.schoolId,
              userId: student.userId,
              type: "progress_update",
              title: "Mémorisation validée ! 🎉",
              titleAr: "تم التحقق من الحفظ! 🎉",
              message: `Félicitations ! Vous avez mémorisé ${surah.nameFr} (${surah.nameAr})`,
              messageAr: `مبروك! لقد حفظتَ ${surah.nameAr}`,
              data: { url: "/student/progress", surahId, progressId: existing.id },
            },
          })
        }

        // Ajouter des étoiles
        await prisma.starsLog.create({
          data: {
            studentId,
            amount: 10,
            balanceAfter: (student.totalStars || 0) + 10,
            sourceType: "memorization",
            sourceId: existing.id,
            reason: `Mémorisation de ${surah.nameFr}`,
            awardedBy: session.user.id,
          },
        })

        await prisma.student.update({
          where: { id: studentId },
          data: { totalStars: { increment: 10 } },
        })

        // Créer l'entrée mémorisée
        const memExists = await prisma.memorizedSurah.findUnique({ where: { progressId: existing.id } })
        if (!memExists) {
          await prisma.memorizedSurah.create({
            data: {
              studentId,
              surahId,
              progressId: existing.id,
              versesMemorized: surah.verseCount,
              starsEarned: 10,
            },
          })
        }
      }
    }

    return NextResponse.json({ progress: updated })
  } else {
    // Nouvelle progression
    const created = await prisma.memorizationProgress.create({
      data: {
        studentId,
        surahId,
        endVerse: surah.verseCount,
        status,
        currentVerse: currentVerse ?? 1,
        completionPercentage: currentVerse ? calcProgress(currentVerse, surah.verseCount) : 0,
        statusHistory: {
          create: {
            oldStatus: "NOT_STARTED",
            newStatus: status,
            changedBy: session.user.id,
            note,
          },
        },
      },
    })
    return NextResponse.json({ progress: created }, { status: 201 })
  }
}
