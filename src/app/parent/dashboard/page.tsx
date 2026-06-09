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
              studentBadges: {
                include: { badge: { select: { icon: true, name: true } } },
                orderBy: { earnedAt: "desc" },
                take: 5,
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

  const children = parent.childrenLinks.map((link) => link.student)
  const childrenIds = children.map(c => c.id)

  // Check which children have attendance marked for tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  const tomorrowEnd = new Date(tomorrow)
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1)

  const tomorrowAttendances = childrenIds.length > 0
    ? await prisma.attendance.findMany({
        where: {
          studentId: { in: childrenIds },
          date: { gte: tomorrow, lt: tomorrowEnd },
        },
        select: { studentId: true, status: true },
      })
    : []

  const missingIds = childrenIds.filter(id => !tomorrowAttendances.some(a => a.studentId === id))

  return (
    <div className="max-w-3xl mx-auto">
      <ParentDashboardClient
        todayDate={formatDate(new Date())}
        children={children}
        missingTomorrowIds={missingIds}
      />
    </div>
  )
}
