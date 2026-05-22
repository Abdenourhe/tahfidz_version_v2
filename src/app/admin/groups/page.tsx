// src/app/admin/groups/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { GroupsListClient } from "@/components/admin/GroupsListClient"

export default async function AdminGroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; status?: string; level?: string; teacherId?: string }>
}) {
  const session = await auth()
  const sp = await searchParams
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login")

  const schoolId = session.user.schoolId
  const search = sp.search || ""
  const page = parseInt(sp.page || "1")
  const limit = 20
  const statusFilter = sp.status || "all"
  const levelFilter = sp.level || ""
  const teacherId = sp.teacherId || ""

  const where: any = { schoolId }
  if (statusFilter === "active") where.isActive = true
  if (statusFilter === "inactive") where.isActive = false
  if (levelFilter) where.level = levelFilter
  if (teacherId) where.teacherId = teacherId

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { nameAr: { contains: search, mode: "insensitive" } },
    ]
  }

  const [groups, total, teachers] = await Promise.all([
    prisma.group.findMany({
      where,
      include: {
        teacher: { include: { user: { select: { fullName: true } } } },
        students: { select: { id: true, totalStars: true } },
        _count: { select: { students: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.group.count({ where }),
    prisma.teacher.findMany({
      where: { user: { schoolId } },
      include: { user: { select: { fullName: true } } },
      orderBy: { user: { fullName: "asc" } },
    }),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <GroupsListClient
      groups={groups}
      total={total}
      page={page}
      totalPages={totalPages}
      search={search}
      statusFilter={statusFilter}
      levelFilter={levelFilter}
      teacherId={teacherId}
      teachers={teachers}
    />
  )
}