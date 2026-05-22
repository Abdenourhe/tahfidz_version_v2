// src/app/admin/teachers/[id]/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { TeacherDetailClient } from "@/components/admin/teachers"

export default async function AdminTeacherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login")

  const resolvedParams = await params

  const [teacher, school] = await Promise.all([
    prisma.teacher.findUnique({
      where: { id: resolvedParams.id },
      include: {
        user: { select: { fullName: true, fullNameAr: true, email: true, phone: true, gender: true, isActive: true, createdAt: true, lastLoginAt: true } },
        groups: { include: { _count: { select: { students: true } } } },
        students: {
          include: { user: { select: { fullName: true, fullNameAr: true, avatar: true } }, _count: { select: { memorizedSurahs: true } } },
          take: 20,
        },
        evaluations: {
          include: {
            student: { include: { user: { select: { fullName: true } } } },
            progress: { include: { surah: { select: { nameFr: true, nameAr: true } } } },
          },
          orderBy: { evaluatedAt: "desc" },
          take: 5,
        },
        _count: { select: { students: true, evaluations: true } },
      },
    }),
    prisma.school.findUnique({
      where: { id: session.user.schoolId },
      select: { name: true, nameAr: true, logo: true },
    }),
  ])

  if (!teacher) notFound()

  const avgScore = teacher.evaluations.length > 0
    ? Math.round(teacher.evaluations.reduce((a, e) => a + e.finalScore, 0) / teacher.evaluations.length)
    : null

  return (
    <TeacherDetailClient
      teacher={teacher}
      school={school}
      avgScore={avgScore}
      // ← SUPPRIMÉ : plus de formatDate ni scoreToGrade
    />
  )
}
