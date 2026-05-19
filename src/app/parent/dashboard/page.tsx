// src/app/parent/dashboard/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { formatDate } from "@/lib/utils"
import { ParentDashboardClient } from "@/components/parent/ParentDashboardClient"

async function getParentData(userId: string) {
  return prisma.parent.findUnique({
    where: { userId },
    include: {
      childrenLinks: {
        where: { isVerified: true },
        include: {
          student: {
            include: {
              user: { select: { fullName: true, fullNameAr: true, avatar: true } },
              group: { select: { name: true } },
              teacher: { include: { user: { select: { fullName: true } } } },
              memorizationProgress: {
                orderBy: { updatedAt: "desc" },
                take: 5,
                include: { surah: { select: { nameFr: true, nameAr: true } } },
              },
              studentBadges: {
                include: { badge: { select: { icon: true, name: true } } },
                orderBy: { earnedAt: "desc" },
                take: 3,
              },
              _count: { select: { memorizedSurahs: true } },
            },
          },
        },
      },
    },
  })
}

export default async function ParentDashboard() {
  const session = await auth()
  if (!session?.user || session.user.role !== "PARENT") redirect("/login")

  const parent = await getParentData(session.user.id)
  if (!parent) redirect("/login")

  const children = parent.childrenLinks.map(link => link.student)

  return (
    <ParentDashboardClient
      todayDate={formatDate(new Date())}
      children={children}
    />
  )
}
