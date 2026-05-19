// src/app/teacher/profile/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { formatDate } from "@/lib/utils"
import { TeacherProfileClient } from "@/components/teacher/TeacherProfileClient"

export default async function TeacherProfilePage() {
  const session = await auth()
  if (!session?.user || !["ADMIN","TEACHER"].includes(session.user.role)) redirect("/login")

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      user: { select: { fullName: true, fullNameAr: true, email: true, phone: true, gender: true, createdAt: true, lastLoginAt: true } },
      groups: {
        where: { isActive: true },
        include: {
          _count: { select: { students: true } },
          students: { select: { totalStars: true, _count: { select: { memorizedSurahs: true } } } },
        },
      },
      students: {
        include: { user: { select: { fullName: true } }, _count: { select: { memorizedSurahs: true } } },
        take: 20,
      },
      evaluations: {
        include: {
          student: { include: { user: { select: { fullName: true } } } },
          progress: { include: { surah: { select: { nameFr: true } } } },
        },
        orderBy: { evaluatedAt: "desc" },
        take: 5,
      },
      _count: { select: { students: true, evaluations: true } },
    },
  })

  if (!teacher) redirect("/teacher/dashboard")

  const totalMemorized = await prisma.memorizationProgress.count({
    where: { status: "MEMORIZED", student: { teacherId: teacher.id } },
  })

  const avgScore = teacher.evaluations.length > 0
    ? Math.round(teacher.evaluations.reduce((a, e) => a + e.finalScore, 0) / teacher.evaluations.length)
    : null

  return (
    <TeacherProfileClient
      teacher={teacher}
      totalMemorized={totalMemorized}
      avgScore={avgScore}
      formatDate={formatDate}
    />
  )
}
