// src/app/admin/profile/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { AdminProfileClient } from "@/components/admin/AdminProfileClient"

export default async function AdminProfilePage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login")

  const admin = await prisma.admin.findUnique({
    where: { userId: session.user.id },
    include: {
      user: {
        select: {
          fullName: true,
          fullNameAr: true,
          email: true,
          phone: true,
          gender: true,
          avatar: true,
          createdAt: true,
          lastLoginAt: true,
          schoolId: true,
        },
      },
    },
  })

  if (!admin) redirect("/login")

  const school = await prisma.school.findUnique({
    where: { id: admin.user.schoolId },
    include: {
      _count: {
        select: { users: true, groups: true },
      },
    },
  })

  const studentCount = await prisma.student.count({
    where: { user: { schoolId: admin.user.schoolId } },
  })
  const teacherCount = await prisma.teacher.count({
    where: { user: { schoolId: admin.user.schoolId } },
  })
  const parentCount = await prisma.parent.count({
    where: { user: { schoolId: admin.user.schoolId } },
  })

  return (
    <AdminProfileClient
      admin={admin}
      school={school}
      stats={{ studentCount, teacherCount, parentCount, groupCount: school?._count.groups ?? 0, userCount: school?._count.users ?? 0 }}
    />
  )
}
