// src/app/admin/library/contents/new/page.tsx

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ContentForm } from "@/components/admin/library/ContentForm"

export default async function NewContentPage() {
  const session = await auth()
  if (!session?.user || !["ADMIN", "SUPERADMIN", "TEACHER"].includes(session.user.role)) {
    redirect("/login")
  }

  const schoolId = session.user.schoolId
  if (!schoolId) redirect("/login")

  const [categories, collections] = await Promise.all([
    prisma.libraryCategory.findMany({
      where: { OR: [{ schoolId }, { schoolId: null }], isActive: true },
      select: { id: true, name: true, color: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.libraryCollection.findMany({
      where: { schoolId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  return <ContentForm categories={categories} collections={collections} isSuperAdmin={session.user.role === "SUPERADMIN"} />
}
