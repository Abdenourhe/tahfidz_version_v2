// src/app/teacher/evaluations/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { TeacherEvaluationsClient } from "@/components/teacher/TeacherEvaluationsClient"

export default async function TeacherEvaluationsPage() {
  const session = await auth()
  if (!session?.user || !["ADMIN", "TEACHER"].includes(session.user.role)) redirect("/login")

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!teacher) redirect("/login")

  // Fetch evaluations with related data
  const evaluations = await prisma.evaluation.findMany({
    where: { teacherId: teacher.id },
    include: {
      student: {
        include: { user: { select: { fullName: true, fullNameAr: true } } },
      },
      progress: {
        include: { surah: { select: { nameFr: true, nameAr: true } } },
      },
    },
    orderBy: { evaluatedAt: "desc" },
  })

  // Stats
  const totalEvals = evaluations.length
  const approvedCount = evaluations.filter(e => e.decision === "APPROVED").length
  const revisionCount = evaluations.filter(e => e.decision === "NEEDS_REVISION").length
  const rejectedCount = evaluations.filter(e => e.decision === "REJECTED").length

  // Fetch students for new evaluation modal
  const students = await prisma.student.findMany({
    where: { teacherId: teacher.id },
    include: { user: { select: { id: true, fullName: true, fullNameAr: true } } },
    orderBy: { user: { fullName: "asc" } },
  })

  return (
    <TeacherEvaluationsClient
      evaluations={evaluations}
      stats={{ total: totalEvals, approved: approvedCount, revision: revisionCount, rejected: rejectedCount }}
      students={students}
    />
  )
}
