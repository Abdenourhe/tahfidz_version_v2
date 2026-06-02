// src/app/student/daily-log/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import StudentDailyLogView from "@/components/student/StudentDailyLogView"

export default async function StudentDailyLogPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "STUDENT") redirect("/login")

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!student) redirect("/login")

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Carnet de suivi</h1>
      <StudentDailyLogView studentId={student.id} />
    </div>
  )
}
