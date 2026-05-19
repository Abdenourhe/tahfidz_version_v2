// src/app/admin/students/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { shortId } from "@/lib/utils"
import { StudentsListClient } from "@/components/admin/StudentsListClient"

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; status?: string }>
}) {
  const session = await auth()
  const sp = await searchParams
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login")

  const schoolId = session.user.schoolId
  const search = sp.search || ""
  const page = parseInt(sp.page || "1")
  const limit = 20
  const statusFilter = sp.status || "all"

  const where: Record<string, unknown> = {}
  if (statusFilter === "active")   where.user = { isActive: true, schoolId }
  if (statusFilter === "inactive") where.user = { isActive: false, schoolId }
  if (statusFilter === "all")      where.user = { schoolId }
  if (search) {
    where.user = {
      ...(typeof where.user === "object" ? where.user as object : {}),
      OR: [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }
  }

  const [students, total] = await Promise.all([
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
    />
  )
}
