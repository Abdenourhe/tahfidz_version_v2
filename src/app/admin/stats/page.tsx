// src/app/admin/stats/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { StatsCharts } from "@/components/admin/StatsCharts"

async function getStatsData(schoolId: string) {
  const now = new Date()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  // Progression mémorisations par mois
  const progressByMonth = await prisma.memorizationProgress.groupBy({
    by: ["status"],
    where: { student: { user: { schoolId } } },
    _count: { id: true },
  })

  // Sourates les plus mémorisées
  const topSurahs = await prisma.memorizationProgress.groupBy({
    by: ["surahId"],
    where: { status: "MEMORIZED", student: { user: { schoolId } } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  })

  const surahDetails = await prisma.surah.findMany({
    where: { id: { in: topSurahs.map(s => s.surahId) } },
    select: { id: true, nameFr: true, nameAr: true },
  })

  const topSurahsWithNames = topSurahs.map(s => ({
    ...s,
    surah: surahDetails.find(sd => sd.id === s.surahId),
  }))

  // Scores d'évaluations par mois (6 derniers mois)
  const evaluationsByMonth = await prisma.evaluation.findMany({
    where: { evaluatedAt: { gte: sixMonthsAgo }, student: { user: { schoolId } } },
    select: { evaluatedAt: true, finalScore: true, decision: true },
    orderBy: { evaluatedAt: "asc" },
  })

  // Regrouper par mois
  const monthNamesFr = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"]
  const monthNamesEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const monthNamesAr = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]
  
  const evalsByMonth: Record<string, { monthFr: string; monthEn: string; monthAr: string; avg: number; count: number; approved: number }> = {}

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    evalsByMonth[key] = { 
      monthFr: monthNamesFr[d.getMonth()], 
      monthEn: monthNamesEn[d.getMonth()],
      monthAr: monthNamesAr[d.getMonth()],
      avg: 0, 
      count: 0, 
      approved: 0 
    }
  }

  evaluationsByMonth.forEach(ev => {
    const d = new Date(ev.evaluatedAt)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (evalsByMonth[key]) {
      evalsByMonth[key].count++
      evalsByMonth[key].avg += ev.finalScore
      if (ev.decision === "APPROVED") evalsByMonth[key].approved++
    }
  })

  const evalTrend = Object.values(evalsByMonth).map(e => ({
    ...e,
    avg: e.count > 0 ? Math.round(e.avg / e.count) : 0,
    approvalRate: e.count > 0 ? Math.round((e.approved / e.count) * 100) : 0,
  }))

  // Taux de présence global
  const attendanceStats = await prisma.attendance.groupBy({
    by: ["status"],
    where: { student: { user: { schoolId } } },
    _count: { id: true },
  })

  // Top élèves par étoiles
  const topStudents = await prisma.student.findMany({
    where: { user: { schoolId } },
    orderBy: { totalStars: "desc" },
    take: 5,
    include: {
      user: { select: { fullName: true } },
      _count: { select: { memorizedSurahs: true } },
    },
  })

  // Stats par groupe
  const groupStats = await prisma.group.findMany({
    where: { isActive: true, schoolId },
    include: {
      _count: { select: { students: true } },
      teacher: { include: { user: { select: { fullName: true } } } },
    },
  })

  return {
    progressByMonth,
    topSurahsWithNames,
    evalTrend,
    attendanceStats,
    topStudents,
    groupStats,
  }
}

export default async function AdminStatsPage() {
  const session = await auth()
  if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) redirect("/login")

  const data = await getStatsData(session.user.schoolId!)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Statistiques</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Vue d'ensemble de l'école</p>
      </div>
      <StatsCharts data={data} />
    </div>
  )
}
