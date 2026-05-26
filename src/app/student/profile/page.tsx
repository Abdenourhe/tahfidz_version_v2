// src/app/student/profile/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { StudentProfileClient } from "@/components/student/StudentProfileClient"

export default async function StudentProfilePage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "STUDENT") redirect("/login")

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    include: {
      user: {
        select: {
          fullName: true,
          fullNameAr: true,
          email: true,
          phone: true,
          gender: true,
          avatar: true,
          createdAt: true,
          lastLoginAt: true,
        },
      },
      group: { select: { name: true, nameAr: true, level: true } },
      teacher: { include: { user: { select: { fullName: true } } } },
      stats: true,
      memorizationProgress: {
        where: { status: { not: "MEMORIZED" } },
        include: { surah: { select: { nameFr: true, nameAr: true, verseCount: true } } },
        orderBy: { updatedAt: "desc" },
        take: 5,
      },
      studentBadges: {
        include: { badge: { select: { name: true, icon: true, rarity: true } } },
        orderBy: { earnedAt: "desc" },
        take: 6,
      },
      attendances: { orderBy: { date: "desc" }, take: 7 },
      _count: {
        select: { memorizedSurahs: true, studentBadges: true, memorizationProgress: true },
      },
    },
  })

  if (!student) redirect("/login")

  return <StudentProfileClient student={student} />
}
