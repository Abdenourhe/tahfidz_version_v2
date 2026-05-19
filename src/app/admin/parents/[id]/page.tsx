// src/app/admin/parents/[id]/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { ParentDetailClient } from "@/components/admin/ParentDetailClient"

export default async function AdminParentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login")

  const resolvedParams = await params

  const [parent, school] = await Promise.all([
    prisma.parent.findUnique({
      where: { id: resolvedParams.id },
      include: {
        user: { select: { fullName: true, fullNameAr: true, email: true, phone: true, gender: true, isActive: true, createdAt: true, lastLoginAt: true } },
        childrenLinks: {
          include: {
            student: {
              include: {
                user: { select: { fullName: true, fullNameAr: true, avatar: true } },
                group: { select: { name: true } },
                teacher: { include: { user: { select: { fullName: true } } } },
                memorizationProgress: {
                  where: { status: { not: "MEMORIZED" } },
                  include: { surah: { select: { nameFr: true, nameAr: true } } },
                  take: 2,
                  orderBy: { updatedAt: "desc" },
                },
                _count: { select: { memorizedSurahs: true } },
              },
            },
          },
        },
      },
    }),
    prisma.school.findUnique({
      where: { id: session.user.schoolId },
      select: { name: true, nameAr: true, logo: true },
    }),
  ])

  if (!parent) notFound()

  return (
    <ParentDetailClient
      parent={parent}
      school={school}
      // ← SUPPRIMÉ : plus de formatDate ni statusLabel
    />
  )
}
