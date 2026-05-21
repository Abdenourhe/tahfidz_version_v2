// src/app/admin/students/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { StudentsListClient } from "@/components/admin/StudentsListClient"

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; status?: string; groupId?: string; teacherId?: string }>
}) {
  const session = await auth()
  const sp = await searchParams
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login")

  const schoolId = session.user.schoolId
  const search = sp.search || ""
  const page = parseInt(sp.page || "1")
  const limit = 20
  const statusFilter = sp.status || "all"
  const groupId = sp.groupId || ""
  const teacherId = sp.teacherId || ""

  // Construction du where
  const where: any = {
    user: { schoolId }
  }

  if (statusFilter === "active")   where.user.isActive = true
  if (statusFilter === "inactive") where.user.isActive = false
  if (groupId)                     where.groupId = groupId
  if (teacherId)                   where.teacherId = teacherId

  if (search) {
    where.user.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ]
  }

  const [students, total, groups, teachers] = await Promise.all([
    prisma.student.findMany({
      where,
      include: {
        user: { select: { fullName: true, email: true, avatar: true, isActive: true, createdAt: true } },
        group: { select: { id: true, name: true } },
        teacher: { include: { user: { select: { fullName: true } } } },
        _count: { select: { memorizedSurahs: true } },
      },
      orderBy: { enrollmentDate: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.student.count({ where }),
    prisma.group.findMany({
      where: { schoolId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.teacher.findMany({
      where: { user: { schoolId } },
      include: { user: { select: { fullName: true } } },
      orderBy: { user: { fullName: "asc" } },
    }),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <StudentsListClient
      students={students}
      total={total}
      page={page}
      totalPages={totalPages}
      search={search}
      statusFilter={statusFilter}
      groupId={groupId}
      teacherId={teacherId}
      groups={groups}
      teachers={teachers}
    />
  )
}