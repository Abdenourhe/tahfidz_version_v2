// src/app/admin/students/page.tsx

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { StudentTableClient } from "@/components/admin/students"

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "TEACHER"].includes(session.user.role)) redirect("/login")

  const { status } = await searchParams
  const schoolId = session.user.schoolId

  const [school, students, groups, teachers] = await Promise.all([
    prisma.school.findUnique({
      where: { id: schoolId },
      select: { name: true, nameAr: true, logo: true, slug: true, address: true, city: true, country: true, phone: true },
    }),
    prisma.student.findMany({
      where: {
        user: { schoolId },
        ...(status === "active" ? { user: { isActive: true } } : {}),
        ...(status === "inactive" ? { user: { isActive: false } } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            fullNameAr: true,
            email: true,
            phone: true,
            gender: true,
            avatar: true,
            isActive: true,
            createdAt: true,
          },
        },
        group: { select: { id: true, name: true, level: true } },
        teacher: { include: { user: { select: { fullName: true } } } },
        parentLinks: {
          include: { parent: { include: { user: { select: { fullName: true } } } } },
          where: { isVerified: true },
        },
        _count: { select: { memorizedSurahs: true } },
      },
      orderBy: { user: { createdAt: "desc" } },
    }),
    prisma.group.findMany({
      where: { schoolId },
      select: { id: true, name: true, level: true },
      orderBy: { name: "asc" },
    }),
    prisma.teacher.findMany({
      where: { user: { schoolId } },
      include: { user: { select: { fullName: true } } },
      orderBy: { user: { fullName: "asc" } },
    }),
  ])

  return (
    <StudentTableClient
      students={students}
      groups={groups}
      teachers={teachers}
      statusFilter={status}
      school={school ?? undefined}
    />
  )
}