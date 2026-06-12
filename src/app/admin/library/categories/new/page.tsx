// src/app/admin/library/categories/new/page.tsx

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { CategoryForm } from "@/components/admin/library/CategoryForm"

export default async function NewCategoryPage() {
  const session = await auth()
  if (!session?.user || !["ADMIN", "SUPERADMIN", "TEACHER"].includes(session.user.role)) {
    redirect("/login")
  }
  return <CategoryForm />
}
