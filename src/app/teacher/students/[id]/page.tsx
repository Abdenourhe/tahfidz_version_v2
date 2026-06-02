// src/app/teacher/students/[id]/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"

import { TeacherStudentDetailClient } from "@/components/teacher/TeacherStudentDetailClient"

export default async function TeacherStudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "TEACHER"].includes(session.user.role)) redirect("/login")

  const student = await prisma.student.findUnique({
    where: { id: (await params).id },
    select: {
      id: true,
      dateOfBirth: true,
      emergencyPhone: true,
      totalStars: true,
      nationality: true,
      spokenLanguages: true,
      user: { select: { fullName: true, fullNameAr: true, email: true, phone: true, gender: true, isActive: true, avatar: true } },
      group: { select: { name: true } },
      teacher: { include: { user: { select: { fullName: true, phone: true, email: true } } } },
      parentLinks: {
        where: { isVerified: true },
        include: {
          parent: { include: { user: { select: { fullName: true, fullNameAr: true, phone: true, email: true } } } },
        },
      },
      memorizationProgress: {
        include: {
          surah: true,
          evaluation: { select: { finalScore: true, decision: true } },
          statusHistory: { orderBy: { changedAt: "desc" }, take: 2 },
        },
        orderBy: { updatedAt: "desc" },
      },
      attendances: { orderBy: { date: "desc" }, take: 14, select: { date: true, status: true } },
      studentBadges: { include: { badge: { select: { icon: true, name: true, rarity: true } } }, orderBy: { earnedAt: "desc" } },
      _count: { select: { memorizedSurahs: true } },
    },
  })

  if (!student) notFound()

  const memorized = student.memorizationProgress.filter((p: any) => p.status === "MEMORIZED")
  const inProgress = student.memorizationProgress.filter((p: any) => p.status !== "MEMORIZED")
  const readyToRecite = inProgress.find((p: any) => ["READY_FOR_RECITATION", "PENDING_TEACHER_APPROVAL"].includes(p.status))

  const totalAtt = student.attendances.length
  const presentAtt = student.attendances.filter((a: any) => a.status === "PRESENT" || a.status === "LATE").length
  const attRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0

  return (
    <TeacherStudentDetailClient
      student={student}
      memorized={memorized}
      inProgress={inProgress}
      readyToRecite={readyToRecite}
      totalAtt={totalAtt}
      presentAtt={presentAtt}
      attRate={attRate}
    />
  )
}
