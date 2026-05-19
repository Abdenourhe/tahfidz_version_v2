// src/app/api/progress/[id]/route.ts — student OR parent updates verse → teacher + parents notified
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { MemorizationStatus } from "@prisma/client"
import { z } from "zod"

const patchSchema = z.object({
  currentVerse:         z.number().int().min(0).optional(),
  status:               z.string().optional(),
  completionPercentage: z.number().min(0).max(100).optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const body   = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const prog = await prisma.memorizationProgress.findUnique({
    where: { id: (await params).id },
    include: {
      surah:   { select: { verseCount: true, nameFr: true, nameAr: true } },
      student: {
        include: {
          user:    { select: { id: true, fullName: true } },
          teacher: { include: { user: { select: { id: true } } } },
          parentLinks: {
            where: { isVerified: true },
            include: { parent: { include: { user: { select: { id: true } } } } },
          },
        },
      },
    },
  })
  if (!prog) return NextResponse.json({ error: "Introuvable" }, { status: 404 })

  const isOwner   = prog.student.userId === session.user.id
  const isTeacher = ["TEACHER","ADMIN"].includes(session.user.role)

  // PARENT: verify this is their child
  let isParent = false
  if (session.user.role === "PARENT") {
    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: { childrenLinks: { where: { isVerified: true }, select: { studentId: true } } },
    })
    isParent = parent?.childrenLinks.some(l => l.studentId === prog.student.id) ?? false
  }

  if (!isOwner && !isTeacher && !isParent) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  // ── Compute updates ──────────────────────────────────────────────────────
  const updateData: Record<string, unknown> = {}
  let verseChanged = false
  let newVerse     = prog.currentVerse
  let newPct       = prog.completionPercentage

  if (parsed.data.currentVerse !== undefined) {
    newVerse = Math.min(parsed.data.currentVerse, prog.surah.verseCount)
    newPct   = prog.surah.verseCount > 0 ? (newVerse / prog.surah.verseCount) * 100 : 0
    updateData.currentVerse         = newVerse
    updateData.completionPercentage = newPct
    verseChanged = newVerse !== prog.currentVerse
  }

  // ── Status change ────────────────────────────────────────────────────────
  if (parsed.data.status && parsed.data.status !== prog.status) {
    updateData.status = parsed.data.status as MemorizationStatus

    await prisma.statusHistory.create({
      data: {
        progressId: (await params).id,
        oldStatus:  prog.status,
        newStatus:  parsed.data.status as MemorizationStatus,
        changedBy:  session.user.id,
      },
    })

    // READY_FOR_RECITATION → notify teacher (triggered by student OR parent)
    if (parsed.data.status === "READY_FOR_RECITATION" && (isOwner || isParent)) {
      const teacherUserId = prog.student.teacher?.user?.id
      const who = isParent ? "son parent" : "lui-même"

      if (teacherUserId) {
        await prisma.notification.create({
          data: {
            schoolId:  session.user.schoolId,
            userId:  teacherUserId,
            type:    "progress_update",
            title:   `⏳ ${prog.student.user.fullName} est prêt à réciter`,
            titleAr: `⏳ ${prog.student.user.fullName} جاهز للتلاوة`,
            message: `Sourate ${prog.surah.nameFr} — ${newVerse}/${prog.surah.verseCount} versets. Signalé par ${who}. Cliquez pour évaluer.`,
            data:    { progressId: (await params).id, studentId: prog.student.id, reportedBy: session.user.role },
          },
        })
      }

      // Notify parents (if student triggered)
      if (isOwner) {
        for (const link of prog.student.parentLinks) {
          await prisma.notification.create({
            data: {
              schoolId:  session.user.schoolId,
              userId:  link.parent.user.id,
              type:    "progress_update",
              title:   `📖 ${prog.student.user.fullName} a terminé ${prog.surah.nameFr}`,
              message: `Votre enfant a complété la sourate et attend l'évaluation de l'enseignant.`,
              data:    { progressId: (await params).id },
            },
          })
        }
      }
    }
  }

  // ── Verse change notifications (student OR parent updating) ───────────────
  // Teacher receives notification when student or parent updates verses
  if (verseChanged && (isOwner || isParent) && !parsed.data.status) {
    const oldPct    = prog.completionPercentage
    const delta     = Math.abs(newVerse - prog.currentVerse)
    const milestone = [25, 50, 75, 100].find(m => oldPct < m && newPct >= m)
    const completed = newVerse >= prog.surah.verseCount
    const teacherUserId = prog.student.teacher?.user?.id

    // Anti-spam: check if teacher was notified in last 5 minutes
    const fiveMinAgo  = new Date(Date.now() - 5 * 60 * 1000)
    const recentNotif = teacherUserId ? await prisma.notification.findFirst({
      where: { userId: teacherUserId, type: "progress_update", createdAt: { gte: fiveMinAgo } },
      orderBy: { createdAt: "desc" },
    }) : null

    // Notify on: milestone, completion, big jump (≥5), or no recent notif
    const shouldNotify = !!milestone || completed || delta >= 5 || !recentNotif
    const updatedBy    = isParent ? " (mis à jour par le parent)" : ""

    if (teacherUserId && shouldNotify) {
      const title = completed
        ? `🎉 ${prog.student.user.fullName} — 100% de ${prog.surah.nameFr}${updatedBy}`
        : milestone
          ? `📊 ${prog.student.user.fullName} — ${milestone}% de ${prog.surah.nameFr}${updatedBy}`
          : `📖 ${prog.student.user.fullName} — Verset ${newVerse}/${prog.surah.verseCount} de ${prog.surah.nameFr}${updatedBy}`

      const message = completed
        ? `Tous les ${prog.surah.verseCount} versets sont complétés${isParent ? " (signalé par le parent)" : ""}. En attente de validation.`
        : `Verset ${newVerse}/${prog.surah.verseCount} (${Math.round(newPct)}%)${delta > 1 ? ` — +${delta} versets` : ""}${isParent ? ` — mis à jour par le parent` : ""}`

      await prisma.notification.create({
        data: {
          schoolId:  session.user.schoolId,
          userId:  teacherUserId,
          type:    "progress_update",
          title,
          message,
          data:    { progressId: (await params).id, currentVerse: newVerse, percentage: Math.round(newPct), milestone, updatedBy: session.user.role },
        },
      })
    }

    // Notify parents at milestones or completion (only if student triggered, not parent)
    if ((milestone || completed) && isOwner) {
      for (const link of prog.student.parentLinks) {
        await prisma.notification.create({
          data: {
            schoolId:  session.user.schoolId,
            userId:  link.parent.user.id,
            type:    "progress_update",
            title:   completed
              ? `🌟 ${prog.student.user.fullName} a terminé ${prog.surah.nameFr} !`
              : `🌟 ${prog.student.user.fullName} — ${milestone}% de ${prog.surah.nameFr}`,
            message: completed
              ? `Votre enfant a mémorisé tous les ${prog.surah.verseCount} versets. Bravo !`
              : `Votre enfant a atteint ${milestone}% de la sourate ${prog.surah.nameFr}.`,
            data:    { progressId: (await params).id, milestone, percentage: Math.round(newPct) },
          },
        })
      }
    }
  }

  const updated = await prisma.memorizationProgress.update({
    where: { id: (await params).id },
    data:  updateData,
  })

  return NextResponse.json({ progress: updated })
}
