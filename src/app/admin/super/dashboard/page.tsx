// src/app/admin/super/dashboard/page.tsx
// Dashboard moderne du SUPERADMIN

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { SuperAdminDashboardClient } from "@/components/admin/superadmin/SuperAdminDashboardClient"

export default async function SuperAdminDashboardPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    redirect("/login")
  }

  const [
    totalSchools,
    activeSchools,
    inactiveSchools,
    totalStudents,
    totalTeachers,
    totalParents,
    pendingRequests,
    recentSchools,
    recentPendingRequests,
  ] = await Promise.all([
    prisma.school.count(),
    prisma.school.count({ where: { isActive: true } }),
    prisma.school.count({ where: { isActive: false } }),
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.parent.count(),
    prisma.schoolRequest.count({ where: { status: "PENDING" } }),
    prisma.school.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, slug: true, plan: true, isActive: true, createdAt: true, _count: { select: { users: true } } },
    }),
    prisma.schoolRequest.findMany({
      take: 5,
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      select: { id: true, schoolName: true, adminEmail: true, adminName: true, status: true, createdAt: true },
    }),
  ])

  return (
    <SuperAdminDashboardClient
      userName={(session.user as any).name ?? session.user.email ?? ""}
      stats={{
        totalSchools,
        activeSchools,
        inactiveSchools,
        totalStudents,
        totalTeachers,
        totalParents,
        pendingRequests,
      }}
      recentSchools={recentSchools as any}
      pendingRequests={recentPendingRequests as any}
    />
  )
}
