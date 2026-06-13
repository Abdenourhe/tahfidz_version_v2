// src/app/admin/library/categories/page.tsx

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { CategoryListClient } from "@/components/admin/library/CategoryListClient"

export default async function CategoriesPage() {
  const session = await auth()
  if (!session?.user || !["ADMIN", "SUPERADMIN", "TEACHER"].includes(session.user.role)) {
    redirect("/login")
  }

  const schoolId = session.user.schoolId
  if (!schoolId) redirect("/login")

  const categories = await prisma.libraryCategory.findMany({
    where: { OR: [{ schoolId }, { schoolId: null }], isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { contents: true } } },
  })

  return <CategoryListClient categories={categories} currentSchoolId={schoolId} />
}
