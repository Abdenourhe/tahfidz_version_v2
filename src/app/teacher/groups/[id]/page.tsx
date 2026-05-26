// src/app/teacher/groups/[id]/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"

import { TeacherGroupDetailClient } from "@/components/teacher/TeacherGroupDetailClient"

export default async function TeacherGroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "TEACHER"].includes(session.user.role)) redirect("/login")

  const group = await prisma.group.findUnique({
    where: { id: (await params).id },
    include: {
      teacher: { include: { user: { select: { fullName: true } } } },
      students: {
        include: {
          user: { select: { fullName: true, fullNameAr: true } },
          memorizationProgress: {
            where: { status: { notIn: ["MEMORIZED"] } },
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
    <TeacherGroupDetailClient
      group={group}
    />
  )
}
