// src/app/admin/parents/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ParentsListClient } from "@/components/admin/parents"

export default async function AdminParentsPage({
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

  const where: Record<string, unknown> = {}
  if (search) {
    where.user = {
      schoolId,
      OR: [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }
  } else {
    where.user = { schoolId }
  }

  const [parents, total] = await Promise.all([
    prisma.parent.findMany({
      where,
      include: {
        user: { select: { fullName: true, fullNameAr: true, email: true, phone: true, isActive: true, createdAt: true } },
        childrenLinks: {
          where: { isVerified: true },
          include: { student: { include: { user: { select: { fullName: true } } } } },
        },
      },
      orderBy: { user: { createdAt: "desc" } },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.parent.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <ParentsListClient
      parents={parents}
      total={total}
      page={page}
      totalPages={totalPages}
      search={search}
       />
  )
}
