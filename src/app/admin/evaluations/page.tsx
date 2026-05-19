// src/app/admin/evaluations/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { EvaluationsListClient } from "@/components/admin/EvaluationsListClient"

export default async function AdminEvaluationsPage({
  searchParams,
}: { searchParams: Promise<{ decision?: string; teacherId?: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login")

  const schoolId = session.user.schoolId
  const sp = await searchParams

  const where: Record<string, unknown> = {}
  where.student = { user: { schoolId } }
  if (sp.decision)  where.decision  = sp.decision
  if (sp.teacherId) where.teacherId = sp.teacherId

  const [evaluations, teachers] = await Promise.all([
    prisma.evaluation.findMany({
      where,
      include: {
        student: { include: { user: { select: { fullName: true } }, group: { select: { name: true } } } },
        teacher: { include: { user: { select: { fullName: true } } } },
        progress: { include: { surah: { select: { nameFr: true, nameAr: true } } } },
      },
      orderBy: { evaluatedAt: "desc" },
      take: 100,
    }),
    prisma.teacher.findMany({ where: { user: { schoolId } }, include: { user: { select: { fullName: true } } } }),
  ])

  const stats = {
    total:    evaluations.length,
    approved: evaluations.filter(e => e.decision === "APPROVED").length,
    revision: evaluations.filter(e => e.decision === "NEEDS_REVISION").length,
    rejected: evaluations.filter(e => e.decision === "REJECTED").length,
    avg:      evaluations.length > 0
      ? Math.round(evaluations.reduce((a, e) => a + e.finalScore, 0) / evaluations.length)
      : 0,
  }

  return (
    <EvaluationsListClient
      evaluations={evaluations}
      teachers={teachers}
      stats={stats}
      decisionFilter={sp.decision}
    />
  )
}
