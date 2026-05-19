// src/app/student/badges/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { formatDate } from "@/lib/utils"
import { StudentBadgesClient } from "@/components/student/StudentBadgesClient"

export default async function StudentBadgesPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "STUDENT") redirect("/login")

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    include: {
      studentBadges: {
        include: { badge: true },
        orderBy: { earnedAt: "desc" },
      },
    },
  })

  if (!student) redirect("/login")

  const allBadges = await prisma.badge.findMany({ orderBy: { criteriaValue: "asc" } })

  return (
    <StudentBadgesClient
      earnedBadges={student.studentBadges}
      allBadges={allBadges}
      totalStars={student.totalStars}
      formatDate={formatDate}
    />
  )
}
