// src/app/api/evaluations/route.ts
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { evaluationSchema } from "@/lib/validations/auth"
import { calculateFinalScore, starsFromScore } from "@/lib/utils"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get("studentId")
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "10")

  const where: Record<string, unknown> = {}

  if (session.user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } })
    if (teacher) where.teacherId = teacher.id
  }

  if (session.user.role === "STUDENT") {
    const student = await prisma.student.findUnique({ where: { userId: session.user.id } })
    if (student) where.studentId = student.id
  }

  // Parent: can only see their verified children's evaluations
  if (session.user.role === "PARENT") {
    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: { childrenLinks: { where: { isVerified: true }, select: { studentId: true } } },
    })
    const childIds = parent?.childrenLinks.map(l => l.studentId) ?? []
    if (studentId && childIds.includes(studentId)) {
      where.studentId = studentId
    } else {
      where.studentId = { in: childIds }
    }
  }

  if (studentId && !["PARENT"].includes(session.user.role)) where.studentId = studentId

  const [evaluations, total] = await Promise.all([
    prisma.evaluation.findMany({
      where,
      include: {
        student: { include: { user: { select: { fullName: true, avatar: true } } } },
        teacher: { include: { user: { select: { fullName: true } } } },
        progress: { include: { surah: { select: { nameFr: true, nameAr: true, id: true } } } },
      },
      orderBy: { evaluatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.evaluation.count({ where }),
  ])

  return NextResponse.json({ evaluations, total, page, limit })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "TEACHER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = evaluationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data

  // Récupérer l'ID du teacher
  const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } })
  if (!teacher && session.user.role === "TEACHER") {
    return NextResponse.json({ error: "Profil enseignant introuvable" }, { status: 404 })
  }

  // Teacher can only evaluate their own students
  if (session.user.role === "TEACHER" && teacher) {
    const targetStudent = await prisma.student.findUnique({
      where: { id: data.studentId }, select: { teacherId: true },
    })
    if (!targetStudent) return NextResponse.json({ error: "Élève introuvable" }, { status: 404 })
    if (targetStudent.teacherId !== teacher.id) {
      return NextResponse.json({ error: "Vous ne pouvez évaluer que vos propres élèves" }, { status: 403 })
    }
  }

  // Calculer le score final (nouveaux critères + compatibilité anciens)
  const tajwid  = data.tajwid  ?? data.tajweedScore
  const makhraj = data.makhraj ?? data.makharijScore ?? 0
  const waqf    = data.waqf    ?? data.fluencyScore
  const tarteel = data.tarteel ?? data.memorizationScore
  const finalScore = Math.round((tajwid + makhraj + waqf + tarteel) / 4)

  const teacherId = teacher?.id || (
    await prisma.teacher.findFirst({ where: { userId: session.user.id } })
  )?.id

  if (!teacherId) {
    return NextResponse.json({ error: "Enseignant introuvable" }, { status: 404 })
  }

  const evaluation = await prisma.evaluation.create({
    data: {
      progressId: data.progressId,
      studentId: data.studentId,
      teacherId,
      evaluationType: data.evaluationType,
      tajwid: tajwid,
      makhraj: makhraj,
      waqf: waqf,
      tarteel: tarteel,
      memorizationScore: data.memorizationScore,
      tajweedScore: data.tajweedScore,
      fluencyScore: data.fluencyScore,
      makharijScore: data.makharijScore,
      tafsirUnderstanding: data.tafsirUnderstanding,
      finalScore,
      teacherNotes: data.teacherNotes,
      strengths: data.strengths,
      improvements: data.improvements,
      revisionRequired: data.revisionRequired,
      decision: data.decision,
    },
  })

  // Mettre à jour le statut de progression
  const newStatus = data.decision === "APPROVED"
    ? "MEMORIZED"
    : data.decision === "NEEDS_REVISION"
    ? "NEEDS_REVISION"
    : "IN_PROGRESS"

  await prisma.memorizationProgress.update({
    where: { id: data.progressId },
    data: {
      status: newStatus,
      completedAt: newStatus === "MEMORIZED" ? new Date() : null,
      statusHistory: {
        create: {
          oldStatus: "PENDING_TEACHER_APPROVAL",
          newStatus,
          changedBy: session.user.id,
          note: `Évaluation: ${data.decision} (${finalScore}/100)`,
        },
      },
    },
  })

  // Attribuer des étoiles si approuvé
  if (data.decision === "APPROVED") {
    const stars = starsFromScore(finalScore)
    const student = await prisma.student.findUnique({ where: { id: data.studentId } })
    if (student && stars > 0) {
      await prisma.$transaction([
        prisma.starsLog.create({
          data: {
            studentId: data.studentId,
            amount: stars,
            balanceAfter: (student.totalStars || 0) + stars,
            sourceType: "memorization",
            sourceId: evaluation.id,
            reason: `Évaluation approuvée - Score: ${finalScore}/100`,
            awardedBy: session.user.id,
          },
        }),
        prisma.student.update({
          where: { id: data.studentId },
          data: { totalStars: { increment: stars } },
        }),
        prisma.notification.create({
          data: {
            schoolId: session.user.schoolId,
            userId: student.userId,
            type: "evaluation",
            title: `Évaluation validée — ${finalScore}/100 🌟`,
            message: `Votre récitation a été approuvée. Vous gagnez ${stars} étoile${stars > 1 ? "s" : ""} !`,
            data: { evaluationId: evaluation.id, score: finalScore, stars },
          },
        }),
      ])
    }
  } else {
    // Notification de révision requise
    const student = await prisma.student.findUnique({ where: { id: data.studentId } })
    if (student) {
      await prisma.notification.create({
        data: {
          schoolId: session.user.schoolId,
          userId: student.userId,
          type: "evaluation",
          title: "Révision requise",
          message: data.teacherNotes || "Votre enseignant a demandé une révision. Continuez vos efforts !",
          data: { evaluationId: evaluation.id },
        },
      })
    }
  }

  return NextResponse.json({ evaluation }, { status: 201 })
}
