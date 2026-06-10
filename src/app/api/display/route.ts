// src/app/api/display/route.ts
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const schoolSlug = searchParams.get("schoolSlug")

  if (!schoolSlug) {
    return NextResponse.json({ error: "schoolSlug requis" }, { status: 400 })
  }

  const school = await prisma.school.findUnique({ where: { slug: schoolSlug }, select: { id: true } })
  if (!school) {
    return NextResponse.json({ error: "École introuvable" }, { status: 404 })
  }

  const schoolId = school.id

  const [students, groups, totalMemorized] = await Promise.all([
    prisma.student.findMany({
      where: { status: "active", user: { isActive: true, schoolId } },
      include: {
        user: { select: { fullName: true, fullNameAr: true } },
        group: { select: { name: true } },
        studentBadges: { include: { badge: { select: { icon: true, rarity: true } } }, take: 6 },
        _count: { select: { memorizedSurahs: true } },
      },
      orderBy: [{ totalStars: "desc" }, { currentStreak: "desc" }],
      take: 20,
    }),
    prisma.group.findMany({
      where: { isActive: true, schoolId },
      include: {
        students: { select: { totalStars: true, _count: { select: { memorizedSurahs: true } } } },
        _count: { select: { students: true } },
      },
    }),
    prisma.memorizationProgress.count({ where: { status: "MEMORIZED", student: { user: { schoolId } } } }),
  ])
  const topStudents = students.map((s, idx) => ({
    id: s.id, rank: idx + 1, user: s.user, group: s.group,
    totalStars: s.totalStars, currentStreak: s.currentStreak,
    memorizedCount: s._count.memorizedSurahs,
    badges: s.studentBadges.map(sb => ({ icon: sb.badge.icon, rarity: sb.badge.rarity })),
  }))
  const groupStats = groups.map(g => ({
    id: g.id, name: g.name,
    memorizedTotal: g.students.reduce((a, s) => a + s._count.memorizedSurahs, 0),
    avgStars: g.students.length > 0 ? Math.round(g.students.reduce((a, s) => a + s.totalStars, 0) / g.students.length) : 0,
    studentCount: g._count.students,
  })).sort((a, b) => b.memorizedTotal - a.memorizedTotal)
  return NextResponse.json({
    topStudents, groupStats, totalMemorized, totalStudents: students.length,
    lastUpdated: new Date().toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" }),
  })
}
