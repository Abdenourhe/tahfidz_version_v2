// src/app/admin/super/schools/page.tsx

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { SuperAdminSchoolsClient } from "@/components/admin/superadmin/SuperAdminSchoolsClient"
import type { School } from "@/components/admin/superadmin/types"

export default async function SuperAdminSchoolsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    redirect("/login")
  }

  const rawSchools = await prisma.school.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { users: true } },
      users: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { role: "asc" },
      },
    },
  })

  const schools: School[] = rawSchools.map((s) => ({
    id: s.id,
    name: s.name,
    nameAr: s.nameAr,
    slug: s.slug,
    plan: s.plan,
    isActive: s.isActive,
    createdAt: s.createdAt.toISOString(),
    logo: s.logo,
    address: s.address,
    city: s.city,
    country: s.country,
    phone: s.phone,
    _count: { users: s._count.users },
    users: s.users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt.toISOString(),
    })),
  }))

  return <SuperAdminSchoolsClient schools={schools} />
}
