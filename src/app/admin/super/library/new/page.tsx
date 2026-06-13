// src/app/admin/super/library/new/page.tsx
// Création d'un contenu global

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ContentForm } from "@/components/admin/library/ContentForm"

export default async function NewGlobalContentPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    redirect("/login")
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
      isSuperAdmin={true}
      defaultVisibility="GLOBAL"
    />
  )
}
