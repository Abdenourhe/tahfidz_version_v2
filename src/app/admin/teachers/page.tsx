// src/app/admin/teachers/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { TeachersListClient } from "@/components/admin/TeachersListClient"

export default async function AdminTeachersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>
}) {
  const session = await auth()
  const sp = await searchParams
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login")

  const schoolId = session.user.schoolId
  const search = sp.search || ""
  const page = parseInt(sp.page || "1")
  const limit = 20

  const where: Record<string, unknown> = search
    ? { user: { schoolId, OR: [{ fullName: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }] } }
    : { user: { schoolId } }

  const [teachers, total] = await Promise.all([
    prisma.teacher.findMany({
      where,
      include: {
        user: { select: { fullName: true, email: true, avatar: true, isActive: true, createdAt: true, gender: true } },
        groups: { select: { id: true, name: true, _count: { select: { students: true } } } },
        _count: { select: { students: true, evaluations: true } },
      },
      orderBy: { user: { createdAt: "desc" } },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.teacher.count({ where }),
  ])

  return (
    <TeachersListClient
      teachers={teachers}
      total={total}
      search={search}
    />
  )
}
