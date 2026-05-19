// src/app/admin/dashboard/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { formatDate } from "@/lib/utils"
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient"

async function getStats(schoolId: string) {
  const [
    totalStudents, totalTeachers, totalParents, totalGroups,
    activeProgress, memorizedCount, recentEvaluations, recentAnnouncements,
  ] = await Promise.all([
    prisma.student.count({ where: { user: { schoolId }, status: "active" } }),
    prisma.teacher.count({ where: { user: { schoolId }, isActive: true } }),
    prisma.parent.count({ where: { user: { schoolId } } }),
    prisma.group.count({ where: { schoolId, isActive: true } }),
    prisma.memorizationProgress.count({
      where: { student: { user: { schoolId } }, status: { in: ["IN_PROGRESS", "UNDER_REVIEW", "READY_FOR_RECITATION"] } },
    }),
    prisma.memorizationProgress.count({
      where: { student: { user: { schoolId } }, status: "MEMORIZED" },
    }),
    prisma.evaluation.findMany({
      take: 5,
      orderBy: { evaluatedAt: "desc" },
      where: { student: { user: { schoolId } } },
      include: {
        student: { include: { user: { select: { fullName: true } } } },
        teacher: { include: { user: { select: { fullName: true } } } },
        progress: { include: { surah: { select: { nameFr: true, nameAr: true } } } },
      },
    }),
    prisma.announcement.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      where: { schoolId, isPublished: true },
      include: { author: { select: { fullName: true } } },
    }),
  ])

  return { totalStudents, totalTeachers, totalParents, totalGroups, activeProgress, memorizedCount, recentEvaluations, recentAnnouncements }
}

export default async function AdminDashboard() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login")

  const stats = await getStats(session.user.schoolId)
  const todayDate = formatDate(new Date())

  return (
    <AdminDashboardClient
      userName={(session.user as any).name ?? session.user.email ?? ""}
      todayDate={todayDate}
      {...stats}
    />
  )
}
