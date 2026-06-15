// src/app/teacher/students/page.tsx
// Page hub du carnet de suivi enseignant : tableau intelligent journalier.

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { TeacherStudentsGrid } from "@/components/teacher/TeacherStudentsGrid"

export const dynamic = "force-dynamic"

export default async function TeacherElevesPage() {
  const session = await auth()
  if (!session?.user || !["ADMIN", "TEACHER"].includes(session.user.role)) {
    redirect("/login")
  }

  const schoolId = session.user.schoolId

  let teacherId: string | undefined
  if (session.user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!teacher) redirect("/teacher/dashboard")
    teacherId = teacher.id
  }

  const groups = await prisma.group.findMany({
    where: {
      schoolId,
      ...(teacherId ? { teacherId } : {}),
    },
    select: { id: true, name: true, nameAr: true, schedule: true },
    orderBy: { name: "asc" },
  })

  const typedGroups = groups.map((g) => ({ ...g, schedule: g.schedule as Record<string, string> | null }))

  return (
    <TeacherStudentsGrid initialGroups={typedGroups} />
  )
}
