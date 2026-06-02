// src/app/student/dashboard/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { StudentDashboardClient } from "@/components/student/StudentDashboardClient"
import StudentMemorizationTracker from "@/components/student/StudentMemorizationTracker"

async function getStudentData(userId: string) {
  const student = await prisma.student.findUnique({
    where: { userId },
    include: {
      user: { select: { fullName: true, fullNameAr: true, schoolId: true } },
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
    take: 5,
    include: { author: { select: { fullName: true } } },
  })

  const upcomingHalaqa = await prisma.halaqaSession.findFirst({
    where: {
      schoolId: student.user.schoolId,
      studentIds: { has: student.userId },
      status: { in: ["SCHEDULED", "LIVE"] },
      scheduledAt: { gte: new Date() },
    },
    orderBy: { scheduledAt: "asc" },
    include: { teacher: { select: { fullName: true } } },
  })

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  const monthAttendances = await prisma.attendance.findMany({
    where: { studentId: student.id, date: { gte: monthStart } },
    orderBy: { date: "asc" },
  })

  const groupLeaderboard = student.groupId
    ? await prisma.student.findMany({
        where: { groupId: student.groupId },
        select: { userId: true, totalStars: true, currentStreak: true, user: { select: { fullName: true, avatar: true } } },
        orderBy: { totalStars: "desc" },
        take: 10,
      })
    : []

  const recentEvaluations = await prisma.halaqaEvaluation.findMany({
    where: { studentId: userId },
    orderBy: { createdAt: "desc" },
    take: 3,
    include: { session: { select: { meetingName: true, scheduledAt: true } } },
  })

  return { student, recentAttendance, announcements, upcomingHalaqa, monthAttendances, groupLeaderboard, recentEvaluations }
}

export default async function StudentDashboard() {
  const session = await auth()
  if (!session?.user || session.user.role !== "STUDENT") redirect("/login")

  const data = await getStudentData(session.user.id)
  if (!data) redirect("/login")

  const { student, recentAttendance, announcements, upcomingHalaqa, monthAttendances, groupLeaderboard, recentEvaluations } = data

  const inProgress = student.memorizationProgress.filter(p =>
    ["IN_PROGRESS", "UNDER_REVIEW", "READY_FOR_RECITATION"].includes(p.status)
  )

  return (
    <div className="space-y-6">
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
        upcomingHalaqa={upcomingHalaqa ? { ...upcomingHalaqa, scheduledAt: upcomingHalaqa.scheduledAt.toISOString() } : null}
        monthAttendances={monthAttendances}
        groupLeaderboard={groupLeaderboard}
        recentEvaluations={recentEvaluations}
      />
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
        <StudentMemorizationTracker />
      </section>
    </div>
  )
}