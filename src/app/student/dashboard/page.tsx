// src/app/student/dashboard/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { StudentDashboardClient } from "@/components/student/StudentDashboardClient"

async function getStudentData(userId: string) {
  const student = await prisma.student.findUnique({
    where: { userId },
    include: {
      user: { select: { fullName: true, fullNameAr: true } },
      group: { select: { name: true } },
      teacher: { include: { user: { select: { fullName: true } } } },
      memorizationProgress: {
        orderBy: { updatedAt: "desc" },
        include: { surah: { select: { nameFr: true, nameAr: true, verseCount: true } } },
        take: 10,
      },
      studentBadges: { include: { badge: true }, orderBy: { earnedAt: "desc" }, take: 6 },
      _count: { select: { memorizedSurahs: true, studentBadges: true } },
      stats: true,
    },
  })
  if (!student) return null

  const recentAttendance = await prisma.attendance.findMany({
    where: { studentId: student.id },
    orderBy: { date: "desc" },
    take: 7,
  })

  const announcements = await prisma.announcement.findMany({
    where: {
      isPublished: true,
      targetRoles: { has: "STUDENT" },
      OR: [{ expiresAt: { gt: new Date() } }, { expiresAt: null }],
    },
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
    take: 3,
    include: { author: { select: { fullName: true } } },
  })

  return { student, recentAttendance, announcements }
}

export default async function StudentDashboard() {
  const session = await auth()
  if (!session?.user || session.user.role !== "STUDENT") redirect("/login")

  const data = await getStudentData(session.user.id)
  if (!data) redirect("/login")

  const { student, recentAttendance, announcements } = data

  const inProgress = student.memorizationProgress.filter(p =>
    ["IN_PROGRESS", "UNDER_REVIEW", "READY_FOR_RECITATION"].includes(p.status)
  )

  // ✅ SUPPRIMÉ : formatAttDate n'est plus passé en prop
  // La fonction est maintenant dans le Client Component

  return (
    <StudentDashboardClient
      studentId={student.id}
      studentName={student.user.fullName}
      studentNameAr={student.user.fullNameAr}
      groupName={student.group?.name ?? null}
      teacherName={student.teacher?.user.fullName ?? null}
      totalStars={student.totalStars}
      currentStreak={student.currentStreak}
      memorizedCount={student._count.memorizedSurahs}
      badgeCount={student._count.studentBadges}
      inProgress={inProgress as any}
      badges={student.studentBadges}
      recentAttendance={recentAttendance}
      announcements={announcements}
      // ✅ SUPPRIMÉ : formatAttDate={formatAttDate}
    />
  )
}