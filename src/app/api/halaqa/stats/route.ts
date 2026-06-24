// src/app/api/halaqa/stats/route.ts
// Statistiques Halaqa Online pour le dashboard admin

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    if (!["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const schoolId = session.user.schoolId

    const [sessions, evaluations] = await Promise.all([
      prisma.halaqaSession.findMany({
        where: { schoolId },
        include: {
          teacher: { select: { id: true, fullName: true } },
        },
      }),
      prisma.halaqaEvaluation.findMany({
        where: { session: { schoolId } },
        select: { memorizationScore: true, tajweedScore: true, fluencyScore: true },
      }),
    ])

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    const byTeacher: Record<string, { name: string; count: number }> = {}
    const byMonth: Record<string, number> = {}
    let currentMonthCount = 0
    let lastMonthCount = 0
    let scheduledCount = 0
    let liveCount = 0
    let endedCount = 0
    let cancelledCount = 0

    sessions.forEach((s) => {
      // Par enseignant
      if (s.teacher) {
        const key = s.teacher.id
        if (!byTeacher[key]) byTeacher[key] = { name: s.teacher.fullName || "—", count: 0 }
        byTeacher[key].count++
      }

      // Par mois
      const d = new Date(s.scheduledAt)
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      byMonth[monthKey] = (byMonth[monthKey] || 0) + 1

      // Compteurs mois courant / précédent
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        currentMonthCount++
      }
      if (d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear()) {
        lastMonthCount++
      }

      // Statuts
      if (s.status === "SCHEDULED") scheduledCount++
      else if (s.status === "LIVE") liveCount++
      else if (s.status === "ENDED") endedCount++
      else if (s.status === "CANCELLED") cancelledCount++
    })

    const total = sessions.length
    const completionRate = total > 0 ? Math.round((endedCount / total) * 100) : 0
    const cancellationRate = total > 0 ? Math.round((cancelledCount / total) * 100) : 0

    const avgMemorization = evaluations.length > 0
      ? Math.round(evaluations.reduce((sum, e) => sum + (e.memorizationScore || 0), 0) / evaluations.length)
      : null
    const avgTajweed = evaluations.length > 0
      ? Math.round(evaluations.reduce((sum, e) => sum + (e.tajweedScore || 0), 0) / evaluations.length)
      : null
    const avgFluency = evaluations.length > 0
      ? Math.round(evaluations.reduce((sum, e) => sum + (e.fluencyScore || 0), 0) / evaluations.length)
      : null

    return NextResponse.json({
      total,
      scheduledCount,
      liveCount,
      endedCount,
      cancelledCount,
      completionRate,
      cancellationRate,
      currentMonthCount,
      lastMonthCount,
      byTeacher: Object.values(byTeacher),
      byMonth,
      avgMemorization,
      avgTajweed,
      avgFluency,
      evaluationsCount: evaluations.length,
    })
  } catch (error: any) {
    console.error("[HALAQA STATS ERROR]", error?.message || String(error))
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
