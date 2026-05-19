// src/app/parent/profile/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { formatDate, statusLabel, formatAge } from "@/lib/utils"
import { ParentProfileClient } from "@/components/parent/ParentProfileClient"

export default async function ParentProfilePage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "PARENT") redirect("/login")

  const parent = await prisma.parent.findUnique({
    where: { userId: session.user.id },
    include: {
      user: { select: { fullName: true, fullNameAr: true, email: true, phone: true, createdAt: true } },
      childrenLinks: {
        where: { isVerified: true },
        include: {
          student: {
            include: {
              user: { select: { fullName: true, fullNameAr: true } },
              group: { select: { name: true } },
              teacher: { include: { user: { select: { fullName: true, phone: true, email: true } } } },
              memorizationProgress: {
                where: { status: { not: "MEMORIZED" } },
                include: { surah: { select: { nameFr: true, nameAr: true, verseCount: true } } },
                orderBy: { updatedAt: "desc" },
                take: 3,
              },
              studentBadges: { include: { badge: { select: { icon: true, name: true, rarity: true } } }, take: 4 },
              attendances: { orderBy: { date: "desc" }, take: 7, select: { status: true, date: true } },
              _count: { select: { memorizedSurahs: true, studentBadges: true } },
            },
          },
        },
      },
    },
  })

  if (!parent) redirect("/login")

  const totalChildren = parent.childrenLinks.length
  const totalMemorized = parent.childrenLinks.reduce((a, l) => a + l.student._count.memorizedSurahs, 0)
  const totalStars = parent.childrenLinks.reduce((a, l) => a + l.student.totalStars, 0)
  const totalBadges = parent.childrenLinks.reduce((a, l) => a + l.student._count.studentBadges, 0)

  return (
    <ParentProfileClient
      parent={parent}
      totalChildren={totalChildren}
      totalMemorized={totalMemorized}
      totalStars={totalStars}
      totalBadges={totalBadges}
      formatDate={formatDate}
      formatAge={formatAge}
      statusLabel={statusLabel}
    />
  )
}
