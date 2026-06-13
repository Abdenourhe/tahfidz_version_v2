// src/app/admin/super/requests/page.tsx

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { SuperAdminRequestsClient } from "@/components/admin/superadmin/SuperAdminRequestsClient"

export default async function SuperAdminRequestsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    redirect("/login")
  }

  const requests = await prisma.schoolRequest.findMany({
    orderBy: { createdAt: "desc" },
  })

  return <SuperAdminRequestsClient requests={requests as any} />
}
