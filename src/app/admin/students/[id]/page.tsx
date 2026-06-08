import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { StudentDetailClient } from "@/components/admin/student-detail"

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "TEACHER"].includes(session.user.role)) redirect("/login")

  const resolvedParams = await params

  const student = await prisma.student.findUnique({
    where: { id: resolvedParams.id },
    select: {
      id: true,
      studentCode: true,
      userId: true,
      groupId: true,
      teacherId: true,
      emergencyPhone: true,
      dateOfBirth: true,
      address: true,
      city: true,
      postalCode: true,
      medicalNotes: true,
      nationality: true,
      spokenLanguages: true,
      currentSurahNote: true,
      user: { select: { fullName: true, fullNameAr: true, email: true, phone: true, gender: true, createdAt: true, isActive: true, avatar: true } },
      group: { select: { id: true, name: true, level: true } },
      teacher: { include: { user: { select: { fullName: true } } } },
      memorizationProgress: {
        include: { surah: true, evaluation: { select: { finalScore: true, decision: true, evaluatedAt: true } } },
        orderBy: { updatedAt: "desc" },
      },
      studentBadges: { include: { badge: true }, orderBy: { earnedAt: "desc" } },
      starsLogs: { orderBy: { createdAt: "desc" }, take: 10 },
      attendances: { orderBy: { date: "desc" }, take: 14 },
      parentLinks: {
        include: { parent: { include: { user: { select: { fullName: true, email: true, phone: true } } } } },
        where: { isVerified: true },
      },
      _count: { select: { memorizedSurahs: true } },
    },
  })

  if (!student) notFound()

  return <StudentDetailClient student={student as any} />
}