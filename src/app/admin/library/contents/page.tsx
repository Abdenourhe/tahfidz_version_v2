// src/app/admin/library/contents/page.tsx

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ContentListClient } from "@/components/admin/library/ContentListClient"

export default async function ContentsPage() {
  const session = await auth()
  if (!session?.user || !["ADMIN", "SUPERADMIN", "TEACHER"].includes(session.user.role)) {
    redirect("/login")
  }

  const schoolId = session.user.schoolId
  if (!schoolId) redirect("/login")

  const [contents, categories, collections] = await Promise.all([
    prisma.libraryContent.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true, color: true } },
        collection: { select: { id: true, name: true } },
        _count: { select: { episodes: true } },
      },
    }),
    prisma.libraryCategory.findMany({
      where: { OR: [{ schoolId }, { schoolId: null }], isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, color: true },
    }),
    prisma.libraryCollection.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    }),
  ])

  return <ContentListClient contents={contents} categories={categories} collections={collections} />
}
