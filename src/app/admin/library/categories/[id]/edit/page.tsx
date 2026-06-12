// src/app/admin/library/categories/[id]/edit/page.tsx

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { CategoryForm } from "@/components/admin/library/CategoryForm"

type Params = { params: Promise<{ id: string }> }

export default async function EditCategoryPage({ params }: Params) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "SUPERADMIN", "TEACHER"].includes(session.user.role)) {
    redirect("/login")
  }

  const schoolId = session.user.schoolId
  if (!schoolId) redirect("/login")

  const { id } = await params
  const category = await prisma.libraryCategory.findUnique({ where: { id } })
  if (!category || (category.schoolId && category.schoolId !== schoolId)) redirect("/admin/library/categories")

  return <CategoryForm category={category} />
}
