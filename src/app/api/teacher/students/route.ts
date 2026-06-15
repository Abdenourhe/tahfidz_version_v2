// src/app/api/teacher/students/route.ts
// GET batch : élèves + logs du jour + progression active + groupes de l'enseignant

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || !["ADMIN", "TEACHER", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const dateParam = searchParams.get("date")
    const groupId = searchParams.get("groupId") || undefined

    if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return NextResponse.json({ error: "Paramètre date requis (YYYY-MM-DD)" }, { status: 400 })
    }

    const dateObj = new Date(dateParam + "T00:00:00Z")
    const schoolId = session.user.schoolId

    // Détermine le teacherId si l'utilisateur est un enseignant
    let teacherId: string | undefined
    if (session.user.role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })
      if (!teacher) return NextResponse.json({ error: "Profil enseignant introuvable" }, { status: 404 })
      teacherId = teacher.id
    }

    // Groupes accessibles
    const groups = await prisma.group.findMany({
      where: {
        schoolId,
        ...(teacherId ? { teacherId } : {}),
        ...(groupId ? { id: groupId } : {}),
      },
      select: { id: true, name: true, nameAr: true },
      orderBy: { name: "asc" },
    })

    const groupIds = groups.map((g) => g.id)

    // Élèves filtrés
    const where: Record<string, unknown> = {
      user: { schoolId, isActive: true },
      ...(teacherId ? { teacherId } : {}),
      ...(groupId ? { groupId } : groupIds.length ? { groupId: { in: groupIds } } : {}),
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, fullNameAr: true, avatar: true } },
        group: { select: { id: true, name: true, nameAr: true } },
        memorizationProgress: {
          where: { status: { not: "MEMORIZED" } },
          orderBy: { updatedAt: "desc" },
          take: 1,
          include: {
            surah: { select: { id: true, nameFr: true, nameAr: true, verseCount: true } },
          },
        },
        dailyLogs: {
          where: { date: dateObj },
          take: 1,
        },
      },
      orderBy: { user: { fullName: "asc" } },
    })

    const result = students.map((s) => {
      const activeProgress = s.memorizationProgress[0] ?? null
      const readyForEvaluation = activeProgress
        ? ["READY_FOR_RECITATION", "PENDING_TEACHER_APPROVAL"].includes(activeProgress.status)
        : false

      return {
        id: s.id,
        user: s.user,
        group: s.group,
        dailyLog: s.dailyLogs[0] ?? null,
        activeProgress,
        readyForEvaluation,
      }
    })

    // Collecte les sourates référencées pour éviter un appel supplémentaire côté client
    const surahIds = new Set<number>()
    students.forEach((s) => {
      s.memorizationProgress.forEach((p) => { if (p.surah?.id) surahIds.add(p.surah.id) })
      const log = s.dailyLogs[0]
      if (log) {
        if (log.hifzFromSurahId) surahIds.add(log.hifzFromSurahId)
        if (log.hifzToSurahId) surahIds.add(log.hifzToSurahId)
        if (log.murajaFromSurahId) surahIds.add(log.murajaFromSurahId)
        if (log.murajaToSurahId) surahIds.add(log.murajaToSurahId)
        if (log.talqinFromSurahId) surahIds.add(log.talqinFromSurahId)
        if (log.talqinToSurahId) surahIds.add(log.talqinToSurahId)
      }
    })

    const surahs = surahIds.size
      ? await prisma.surah.findMany({
          where: { id: { in: Array.from(surahIds) } },
          select: { id: true, nameFr: true, nameAr: true, verseCount: true },
        })
      : []

    return NextResponse.json({ students: result, groups, surahs })
  } catch (error: any) {
    console.error("[TEACHER ELEVES GET]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}
