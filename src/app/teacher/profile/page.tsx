// src/app/teacher/profile/page.tsx
// Profil ENSEIGNANT uniquement — aucune donnée élève ici

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { TeacherProfileClient } from "@/components/teacher/TeacherProfileClient"

export default async function TeacherProfilePage() {
  const session = await auth()
  if (!session?.user || !["ADMIN", "TEACHER"].includes(session.user.role)) {
    redirect("/login")
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      user: {
        select: {
          fullName: true,
          fullNameAr: true,
          email: true,
          phone: true,
          gender: true,
          avatar: true,
          createdAt: true,
          lastLoginAt: true,
        },
      },
      groups: {
        where: { isActive: true },
        include: {
          _count: { select: { students: true } },
        },
      },
      _count: {
        select: { groups: true, evaluations: true },
      },
    },
  })

  if (!teacher) redirect("/teacher/dashboard")

  const totalStudents = teacher.groups.reduce((sum, g) => sum + g._count.students, 0)

  return (
    <TeacherProfileClient
      teacher={teacher}
      totalStudents={totalStudents}
    />
  )
}
