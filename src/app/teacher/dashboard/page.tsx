// src/app/teacher/dashboard/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { formatDate } from "@/lib/utils"
import { TeacherDashboardClient } from "@/components/teacher/TeacherDashboardClient"

async function getTeacherData(userId: string) {
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    include: {
      groups: {
        where: { isActive: true },
        include: {
          students: {
            include: {
              user: { select: { fullName: true, avatar: true } },
              memorizationProgress: {
                where: { status: { in: ["IN_PROGRESS","READY_FOR_RECITATION","PENDING_TEACHER_APPROVAL","NEEDS_REVISION"] } },
                include: { surah: { select: { nameFr: true, nameAr: true } } },
                take: 1, orderBy: { updatedAt: "desc" },
              },
            },
          },
          _count: { select: { students: true } },
        },
      },
    },
  })
  if (!teacher) return null

  const readyToRecite = await prisma.memorizationProgress.findMany({
    where: {
      status: { in: ["READY_FOR_RECITATION", "PENDING_TEACHER_APPROVAL"] },
      student: { teacherId: teacher.id },
    },
    include: {
      student: { include: { user: { select: { fullName: true } } } },
      surah: { select: { nameFr: true, nameAr: true } },
    },
    orderBy: { updatedAt: "asc" },
  })

  const totalStudents = teacher.groups.reduce((acc, g) => acc + g._count.students, 0)
  const totalMemorized = await prisma.memorizationProgress.count({
    where: { status: "MEMORIZED", student: { teacherId: teacher.id } },
  })

  return { teacher, readyToRecite, totalStudents, totalMemorized }
}

export default async function TeacherDashboard() {
  const session = await auth()
  if (!session?.user || !["ADMIN","TEACHER"].includes(session.user.role)) redirect("/login")

  const data = await getTeacherData(session.user.id)
  if (!data) redirect("/login")

  const { teacher, readyToRecite, totalStudents, totalMemorized } = data

  return (
    <TeacherDashboardClient
      todayDate={formatDate(new Date())}
      totalStudents={totalStudents}
      totalMemorized={totalMemorized}
      groups={teacher.groups}
      readyToRecite={readyToRecite as any}
    />
  )
}
