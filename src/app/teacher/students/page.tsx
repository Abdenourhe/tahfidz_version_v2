// src/app/teacher/students/page.tsx — FIXED filters + profile + evaluate

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { calculateAge } from "@/lib/utils"
import { TeacherStudentsListClient } from "@/components/teacher/TeacherStudentsListClient"

export default async function TeacherStudentsPage({
  searchParams,
}: { searchParams: Promise<{ search?: string; status?: string }> }) {
  const session = await auth()
  if (!session?.user || !["ADMIN","TEACHER"].includes(session.user.role)) redirect("/login")

  const sp = await searchParams
  const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } })
  const search  = sp.search || ""
  const statusFilter = sp.status || ""

  const where: Record<string, unknown> = {}
  if (session.user.role === "TEACHER" && teacher) where.teacherId = teacher.id
  if (search) {
    where.user = {
      OR: [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }
  }

  const students = await prisma.student.findMany({
    where,
    include: {
      user: { select: { fullName: true, email: true, avatar: true } },
      group: { select: { id: true, name: true } },
      memorizationProgress: {
        orderBy: { updatedAt: "desc" },
        include: { surah: { select: { nameFr: true, nameAr: true } } },
        where: statusFilter
          ? { status: statusFilter as any }
          : { status: { notIn: ["MEMORIZED"] } },
      },
      _count: { select: { memorizedSurahs: true } },
    },
    orderBy: { enrollmentDate: "desc" },
  })

  const filteredStudents = statusFilter
    ? students.filter(s => s.memorizationProgress.length > 0)
    : students

  return (
    <TeacherStudentsListClient
      students={filteredStudents as any}
      search={search}
      statusFilter={statusFilter}
      calculateAge={calculateAge}
    />
  )
}
