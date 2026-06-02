// src/app/student/messages/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { StudentMessagesClient } from "@/components/student/messages/StudentMessagesClient"

export default async function StudentMessagesPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "STUDENT") redirect("/login")

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: { teacherId: true },
  })
  if (!student) redirect("/login")

  const teacher = student.teacherId
    ? await prisma.teacher.findUnique({
        where: { id: student.teacherId },
        select: { userId: true, user: { select: { fullName: true } } },
      })
    : null

  return (
    <StudentMessagesClient
      teacherUserId={teacher?.userId ?? null}
      teacherName={teacher?.user.fullName ?? null}
    />
  )
}
