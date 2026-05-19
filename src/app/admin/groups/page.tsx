// src/app/admin/groups/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { GroupsListClient } from "@/components/admin/GroupsListClient"

export default async function AdminGroupsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login")

  const schoolId = session.user.schoolId

  const groups = await prisma.group.findMany({
    where: { schoolId },
    include: {
      teacher: { include: { user: { select: { fullName: true } } } },
      students: { select: { id: true, totalStars: true } },
      _count: { select: { students: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <GroupsListClient
      groups={groups}
        />
  )
}
