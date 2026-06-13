// src/app/admin/super/library/[id]/edit/page.tsx
// Édition d'un contenu global

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ContentForm } from "@/components/admin/library/ContentForm"

type Params = { params: Promise<{ id: string }> }

export default async function EditGlobalContentPage({ params }: Params) {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    redirect("/login")
  }

  const { id } = await params
  const content = await prisma.libraryContent.findUnique({
    where: { id },
    include: { episodes: { orderBy: { episodeOrder: "asc" } } },
  })

  if (!content || content.visibility !== "GLOBAL") {
    redirect("/admin/super/library")
  }

  const categories = await prisma.libraryCategory.findMany({
    where: { schoolId: null, isActive: true },
    select: { id: true, name: true, color: true },
    orderBy: { sortOrder: "asc" },
  })

  return (
    <ContentForm
      categories={categories}
      collections={[]}
      content={content as any}
      isSuperAdmin={true}
      defaultVisibility="GLOBAL"
    />
  )
}
