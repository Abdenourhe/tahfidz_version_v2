// src/app/admin/super/schools/page.tsx

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { SuperAdminSchoolsClient } from "@/components/admin/superadmin/SuperAdminSchoolsClient"

export default async function SuperAdminSchoolsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    redirect("/login")
  }

  const schools = await prisma.school.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      isActive: true,
      city: true,
      country: true,
      createdAt: true,
      _count: { select: { users: true } },
    },
  })

  return <SuperAdminSchoolsClient schools={schools as any} />
}
