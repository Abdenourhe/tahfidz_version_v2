// src/app/student/progress/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { statusLabel, formatDate } from "@/lib/utils"
import { StudentProgressClient } from "@/components/student/StudentProgressClient"

export default async function StudentProgressPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "STUDENT") redirect("/login")

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    include: {
      memorizationProgress: {
        include: {
          surah: true,
          statusHistory: { orderBy: { changedAt: "desc" }, take: 3 },
          evaluation: { select: { finalScore: true, decision: true } },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  })

  if (!student) redirect("/login")

  const memorized = student.memorizationProgress.filter(p => p.status === "MEMORIZED")
  const inProgress = student.memorizationProgress.filter(p => p.status !== "MEMORIZED")

  return (
    <StudentProgressClient
      studentId={student.id}
      memorized={memorized}
      inProgress={inProgress}
      formatDate={formatDate}
      statusLabel={statusLabel}
    />
  )
}
