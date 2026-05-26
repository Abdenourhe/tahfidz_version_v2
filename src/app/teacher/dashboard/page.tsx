// src/app/teacher/dashboard/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { TeacherDashboardClient } from "@/components/teacher/TeacherDashboardClient"

export default async function TeacherDashboardPage() {
  const session = await auth()
  if (!session?.user || !["ADMIN", "TEACHER"].includes(session.user.role)) redirect("/login")

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      user: { select: { fullName: true, fullNameAr: true } },
      _count: { select: { students: true, groups: true } },
    },
  })

  if (!teacher) redirect("/login")

  const totalStudents = teacher._count.students
  const totalGroups = teacher._count.groups

  const activeAssignments = await prisma.memorizationProgress.count({
    where: { teacherId: teacher.id, status: { not: "MEMORIZED" } },
  })

  const pendingAttendances = await prisma.parentAttendance.count({
    where: { validatedBy: null, student: { teacherId: teacher.id } },
  })

  return (
    <TeacherDashboardClient
      teacher={teacher}
      stats={{ totalStudents, totalGroups, activeAssignments, pendingAttendances }}
    />
  )
}
