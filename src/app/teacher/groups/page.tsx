// src/app/teacher/groups/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { TeacherGroupsListClient } from "@/components/teacher/TeacherGroupsListClient"

export default async function TeacherGroupsPage() {
  const session = await auth()
  if (!session?.user || !["ADMIN", "TEACHER"].includes(session.user.role)) redirect("/login")

  const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } })

  const groups = await prisma.group.findMany({
    where: teacher ? { teacherId: teacher.id, isActive: true } : { isActive: true },
    include: {
      students: {
        include: {
          user: { select: { fullName: true } },
          _count: { select: { memorizedSurahs: true } },
        },
      },
      _count: { select: { students: true } },
    },
    orderBy: { name: "asc" },
  })

  return (
    <TeacherGroupsListClient groups={groups} />
  )
}
