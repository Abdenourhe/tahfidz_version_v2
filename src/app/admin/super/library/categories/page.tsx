// src/app/admin/super/library/categories/page.tsx
// Gestion des catégories globales de la bibliothèque

import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { SuperAdminCategoryListClient } from "@/components/superadmin/SuperAdminCategoryListClient"

export default async function SuperAdminCategoriesPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    redirect("/login")
  }

  const categories = await prisma.libraryCategory.findMany({
    where: { schoolId: null, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  })

  return (
    <div className="p-6">
      <SuperAdminCategoryListClient initialCategories={categories} />
    </div>
  )
}
