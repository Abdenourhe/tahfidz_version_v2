// src/app/admin/library/contents/[id]/edit/page.tsx

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ContentForm } from "@/components/admin/library/ContentForm"

type Params = { params: Promise<{ id: string }> }

export default async function EditContentPage({ params }: Params) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "SUPERADMIN", "TEACHER"].includes(session.user.role)) {
    redirect("/login")
  }

  const schoolId = session.user.schoolId
  if (!schoolId) redirect("/login")

  const { id } = await params
  const content = await prisma.libraryContent.findUnique({
    where: { id },
    include: { episodes: { orderBy: { episodeOrder: "asc" } } },
  })
  if (!content || (content.schoolId !== schoolId && session.user.role !== "SUPERADMIN")) redirect("/admin/library/contents")

  const [categories, collections] = await Promise.all([
    prisma.libraryCategory.findMany({
      where: { schoolId, isActive: true },
      select: { id: true, name: true, color: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.libraryCollection.findMany({
      where: { schoolId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  return <ContentForm categories={categories} collections={collections} content={content as any} isSuperAdmin={session.user.role === "SUPERADMIN"} />
}
