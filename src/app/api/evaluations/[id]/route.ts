// src/app/api/evaluations/[id]/route.ts — FIXED: correct StarsLog fields
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { calculateFinalScore, starsFromScore } from "@/lib/utils"
import { z } from "zod"

const patchSchema = z.object({
  tajwid:            z.number().min(0).max(100).optional(),
  makhraj:           z.number().min(0).max(100).optional(),
  waqf:              z.number().min(0).max(100).optional(),
  tarteel:           z.number().min(0).max(100).optional(),
  memorizationScore: z.number().min(0).max(100).optional(),
  tajweedScore:      z.number().min(0).max(100).optional(),
  fluencyScore:      z.number().min(0).max(100).optional(),
  makharijScore:     z.number().min(0).max(100).optional(),
  teacherNotes:      z.string().optional(),
  decision:          z.enum(["APPROVED","NEEDS_REVISION","REJECTED"]).optional(),
  revisionRequired:  z.boolean().optional(),
})

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const evaluation = await prisma.evaluation.findUnique({
    where: { id: (await params).id },
    include: {
      student: { include: { user: { select: { fullName: true, email: true } } } },
      teacher: { include: { user: { select: { fullName: true } } } },
      progress: { include: { surah: true, statusHistory: { orderBy: { changedAt: "desc" }, take: 5 } } },
    },
  })
  if (!evaluation) return NextResponse.json({ error: "Introuvable" }, { status: 404 })
  return NextResponse.json({ evaluation })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || !["ADMIN","TEACHER","SUPERADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id } = await params

  const existing = await prisma.evaluation.findUnique({
    where: { id },
    include: { student: { select: { teacherId: true } } },
  })
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 })

  let teacherId: string | null = null
  if (session.user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id }, select: { id: true } })
    teacherId = teacher?.id ?? null
  }

  const canDelete =
    session.user.role === "SUPERADMIN" ||
    session.user.role === "ADMIN" ||
    (session.user.role === "TEACHER" && existing.student?.teacherId === teacherId)

  if (!canDelete) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  await prisma.evaluation.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || !["ADMIN","TEACHER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body   = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const existing = await prisma.evaluation.findUnique({
    where: { id: (await params).id },
    include: {
      progress: { include: { surah: { select: { nameFr: true, nameAr: true } } } },
      student:  { include: { user: { select: { id: true, fullName: true } } } },
    },
  })
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 })

  const tajwid  = parsed.data.tajwid  ?? existing.tajwid  ?? existing.tajweedScore ?? 0
  const makhraj = parsed.data.makhraj ?? existing.makhraj ?? existing.makharijScore ?? 0
  const waqf    = parsed.data.waqf    ?? existing.waqf    ?? existing.fluencyScore ?? 0
  const tarteel = parsed.data.tarteel ?? existing.tarteel ?? existing.memorizationScore ?? 0
  const newScore = Math.round((tajwid + makhraj + waqf + tarteel) / 4)

  const newDecision = parsed.data.decision ?? existing.decision

  const updated = await prisma.evaluation.update({
    where: { id: (await params).id },
    data: {
      tajwid,
      makhraj,
      waqf,
      tarteel,
      memorizationScore: parsed.data.memorizationScore ?? existing.memorizationScore,
      tajweedScore:      parsed.data.tajweedScore      ?? existing.tajweedScore,
      fluencyScore:      parsed.data.fluencyScore      ?? existing.fluencyScore,
      makharijScore:     parsed.data.makharijScore     ?? existing.makharijScore,
      finalScore:        newScore,
      teacherNotes:      parsed.data.teacherNotes ?? existing.teacherNotes,
      decision:          newDecision,
      revisionRequired:  parsed.data.revisionRequired ?? existing.revisionRequired,
    },
  })

  // Update progression status
  if (parsed.data.decision && parsed.data.decision !== existing.decision) {
    const newStatus = newDecision === "APPROVED"      ? "MEMORIZED"
      : newDecision === "NEEDS_REVISION" ? "NEEDS_REVISION"
      : "IN_PROGRESS"

    await prisma.memorizationProgress.update({
      where: { id: existing.progressId },
      data: { status: newStatus, completedAt: newStatus === "MEMORIZED" ? new Date() : null },
    })

    // Award stars if newly approved
    if (newDecision === "APPROVED" && existing.decision !== "APPROVED") {
      const stars = starsFromScore(newScore)
      const student = await prisma.student.findUnique({ where: { id: existing.studentId } })
      if (student && stars > 0) {
        await prisma.student.update({ where: { id: existing.studentId }, data: { totalStars: { increment: stars } } })
        // StarsLog uses 'amount' and 'balanceAfter' - correct fields
        await prisma.starsLog.create({
          data: {
            studentId:   existing.studentId,
            amount:      stars,
            balanceAfter: (student.totalStars || 0) + stars,
            sourceType:  "memorization",
            sourceId:    (await params).id,
            reason:      `Mémorisation approuvée : ${existing.progress.surah.nameFr}`,
            awardedBy:   session.user.id,
          },
        })
      }
    }

    // Notify student
    await prisma.notification.create({
      data: {
        schoolId: session.user.schoolId,
        userId: existing.student.user.id,
        type:   "evaluation",
        title:  `Évaluation mise à jour — ${existing.progress.surah.nameFr}`,
        titleAr:`تحديث التقييم — ${existing.progress.surah.nameAr}`,
        message: newDecision === "APPROVED"
          ? `✅ Approuvé ! Score : ${newScore}/100. Vous gagnez ${starsFromScore(newScore)} étoile(s) !`
          : newDecision === "NEEDS_REVISION"
          ? `↺ Révision requise. Score : ${newScore}/100. ${parsed.data.teacherNotes || "Continuez vos efforts !"}`
          : `✗ À refaire. Score : ${newScore}/100. ${parsed.data.teacherNotes || ""}`,
        data: { evaluationId: (await params).id, score: newScore, decision: newDecision },
      },
    })
  }

  return NextResponse.json({ evaluation: updated })
}
