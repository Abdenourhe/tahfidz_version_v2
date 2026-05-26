// src/app/superadmin/profile/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { SuperadminProfileClient } from "@/components/superadmin/SuperadminProfileClient"

export default async function SuperadminProfilePage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPERADMIN") redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      fullName: true,
      fullNameAr: true,
      email: true,
      phone: true,
      avatar: true,
      createdAt: true,
      lastLoginAt: true,
    },
  })

  if (!user) redirect("/login")

  const schoolCount = await prisma.school.count()
  const requestCount = await prisma.schoolRequest.count()
  const pendingCount = await prisma.schoolRequest.count({ where: { status: "PENDING" } })
  const approvedCount = await prisma.schoolRequest.count({ where: { status: "APPROVED" } })
  const rejectedCount = await prisma.schoolRequest.count({ where: { status: "REJECTED" } })
  const userCount = await prisma.user.count()

  const recentRequests = await prisma.schoolRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      schoolName: true,
      city: true,
      country: true,
      status: true,
      createdAt: true,
      plan: true,
    },
  })

  return (
    <SuperadminProfileClient
      user={user}
      stats={{ schoolCount, requestCount, pendingCount, approvedCount, rejectedCount, userCount }}
      recentRequests={recentRequests}
    />
  )
}
