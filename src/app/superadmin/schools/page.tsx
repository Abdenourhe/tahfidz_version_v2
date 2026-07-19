// src/app/superadmin/schools/page.tsx
// Gestion des écoles et quotas Halaqa — Administration TAHFIDZ

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { SchoolsQuotaClient } from "@/components/superadmin/SchoolsQuotaClient"

export const metadata = {
  title: "Écoles & Quotas Halaqa — Administration TAHFIDZ",
  description: "Gestion des quotas Halaqa par école",
}

export const dynamic = "force-dynamic"

export default async function SuperAdminSchoolsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    redirect("/login")
  }

  const schools = await prisma.school.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { users: true } },
    },
  })

  // Formatter les données pour le client
  const formattedSchools = schools.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    plan: s.plan,
    isActive: s.isActive,
    billingCycle: s.billingCycle,
    subscriptionStart: s.subscriptionStart.toISOString(),
    halaqaMonthlyLimit: s.halaqaMonthlyLimit,
    halaqaBonusCredits: s.halaqaBonusCredits,
    halaqaBonusExpiry: s.halaqaBonusExpiry?.toISOString() || null,
    halaqaPlannedCount: s.halaqaPlannedCount,
    halaqaSessionsUsed: s.halaqaSessionsUsed,
    halaqaUsagePeriodStart: s.halaqaUsagePeriodStart.toISOString(),
    maxTeachers: s.maxTeachers,
    maxStudents: s.maxStudents,
    halaqaMaxDuration: s.halaqaMaxDuration,
    halaqaAllowRecording: s.halaqaAllowRecording,
    totalUsers: s._count.users,
  }))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Écoles & Quotas Halaqa
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gérez les abonnements et les quotas de sessions Halaqa par école.
          </p>
        </div>

        <SchoolsQuotaClient schools={formattedSchools} />
      </div>
    </div>
  )
}
