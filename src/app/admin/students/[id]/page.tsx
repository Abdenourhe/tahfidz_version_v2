// src/app/admin/students/[id]/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { StudentDetailClient } from "@/components/admin/StudentDetailClient"

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "TEACHER"].includes(session.user.role)) redirect("/login")

  const resolvedParams = await params

  const [student, school] = await Promise.all([
    prisma.student.findUnique({
      where: { id: resolvedParams.id },
      include: {
        user: { select: { fullName: true, fullNameAr: true, email: true, phone: true, gender: true, createdAt: true, isActive: true, avatar: true } },
        group: { select: { name: true, level: true } },
        teacher: { include: { user: { select: { fullName: true } } } },
        memorizationProgress: {
          include: { surah: true, evaluation: { select: { finalScore: true, decision: true, evaluatedAt: true } } },
          orderBy: { updatedAt: "desc" },
        },
        studentBadges: { include: { badge: true }, orderBy: { earnedAt: "desc" } },
        starsLogs: { orderBy: { createdAt: "desc" }, take: 10 },
        attendances: { orderBy: { date: "desc" }, take: 14 },
        parentLinks: {
          include: { parent: { include: { user: { select: { fullName: true, email: true } } } } },
          where: { isVerified: true },
        },
        _count: { select: { memorizedSurahs: true } },
      },
    }),
    prisma.school.findUnique({
      where: { id: session.user.schoolId },
      select: { name: true, nameAr: true, logo: true },
    }),
  ])

  if (!student) notFound()

  const memorized = student.memorizationProgress.filter((p: any) => p.status === "MEMORIZED")
  const inProgress = student.memorizationProgress.filter((p: any) => p.status !== "MEMORIZED")
  const attendanceRate = student.attendances.length > 0
    ? Math.round((student.attendances.filter((a: any) => a.status === "PRESENT" || a.status === "LATE").length / student.attendances.length) * 100)
    : 0

  return (
    <StudentDetailClient
      student={student}
      school={school}
      memorized={memorized}
      inProgress={inProgress}
      attendanceRate={attendanceRate}
    />
  )
}