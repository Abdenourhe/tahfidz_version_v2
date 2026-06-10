"use server"
// src/app/teacher/evaluations/actions.ts
// Server Action pour créer une évaluation

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createEvaluation(formData: FormData) {
  const session = await auth()
  if (!session?.user || session.user.role !== "TEACHER") {
    throw new Error("Unauthorized")
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!teacher) throw new Error("Teacher not found")

  const progressId = formData.get("progressId") as string
  const studentId = formData.get("studentId") as string
  const tajwid = parseInt(formData.get("tajwid") as string) || 0
  const makhraj = parseInt(formData.get("makhraj") as string) || 0
  const waqf = parseInt(formData.get("waqf") as string) || 0
  const tarteel = parseInt(formData.get("tarteel") as string) || 0
  const decision = formData.get("decision") as string
  const notes = formData.get("notes") as string

  if (!progressId || !studentId || !decision) {
    throw new Error("Missing required fields")
  }

  // Vérifier que l'assignment appartient bien au teacher
  const progress = await prisma.memorizationProgress.findFirst({
    where: { id: progressId, teacherId: teacher.id, studentId },
    include: { surah: true, student: { include: { user: true } } },
  })
  if (!progress) throw new Error("Assignment not found or unauthorized")

  // Calculer le score final (moyenne des 4 critères)
  const finalScore = Math.round((tajwid + makhraj + waqf + tarteel) / 4)

  // Créer l'évaluation
  const evaluation = await prisma.evaluation.create({
    data: {
      progressId,
      studentId,
      teacherId: teacher.id,
      evaluationType: "RECITATION",
      tajwid,
      makhraj,
      waqf,
      tarteel,
      memorizationScore: tarteel,
      tajweedScore: tajwid,
      fluencyScore: waqf,
      makharijScore: makhraj,
      finalScore,
      teacherNotes: notes || null,
      revisionRequired: decision === "NEEDS_REVISION",
      decision: decision as any,
    },
  })

  // Mettre à jour le statut de la progression selon la décision
  if (decision === "APPROVED") {
    await prisma.memorizationProgress.update({
      where: { id: progressId },
      data: { status: "MEMORIZED", completedAt: new Date() },
    })
  } else if (decision === "NEEDS_REVISION") {
    await prisma.memorizationProgress.update({
      where: { id: progressId },
      data: { status: "NEEDS_REVISION" },
    })
  }

  // Notifier l'élève (si prefs autorisent)
  const studentPrefs = await prisma.user.findUnique({
    where: { id: progress.student.userId },
    select: { evaluationNotifications: true },
  })
  if (studentPrefs?.evaluationNotifications !== false) {
    await prisma.notification.create({
      data: {
        schoolId: session.user.schoolId,
        userId: progress.student.userId,
        type: "EVALUATION_CREATED",
        title: "Nouvelle évaluation",
        titleAr: "تقييم جديد",
        message: `Votre évaluation de ${progress.surah.nameFr} est disponible. Score : ${finalScore}/100`,
        messageAr: `تقييمك لسورة ${progress.surah.nameAr} متاح. الدرجة : ${finalScore}/100`,
        data: { evaluationId: evaluation.id, progressId, surahId: progress.surahId, url: "/student/progress" },
      },
    })
  }

  revalidatePath("/teacher/evaluations")
  return { success: true, evaluation }
}
