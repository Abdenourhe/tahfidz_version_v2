// src/app/admin/groups/[id]/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { GroupDetailClient } from "@/components/admin/GroupDetailClient"

export default async function AdminGroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login")

  const group = await prisma.group.findUnique({
    where: { id: (await params).id },
    include: {
      teacher: { include: { user: { select: { fullName: true, fullNameAr: true, email: true } } } },
      students: {
        include: {
          user: { select: { fullName: true, fullNameAr: true, email: true, isActive: true } },
          group: { select: { id: true, name: true } },
          memorizationProgress: {
            where: { status: { not: "MEMORIZED" } },
            include: { surah: { select: { nameFr: true, nameAr: true } } },
            take: 1, orderBy: { updatedAt: "desc" },
          },
          _count: { select: { memorizedSurahs: true } },
        },
        orderBy: { user: { fullName: "asc" } },
      },
      _count: { select: { students: true } },
    },
  })

  if (!group) notFound()

  return (
    <GroupDetailClient
      group={group}
      // ← SUPPRIMÉ : plus de formatDate
    />
  )
}
