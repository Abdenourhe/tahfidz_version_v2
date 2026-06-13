// src/app/teacher/library/page.tsx

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { LibraryPageClient } from "@/components/library/LibraryPageClient"
import { getAccessibleCollections, getAccessibleContents, getGlobalContents, getUserProgressMap, getUserBookmarks } from "@/lib/library/access"

export default async function TeacherLibraryPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "TEACHER") redirect("/login")

  const user = { id: session.user.id, role: session.user.role as any, schoolId: session.user.schoolId }
  const [collections, contents, globalContents, bookmarks, progressMap] = await Promise.all([
    getAccessibleCollections(user),
    getAccessibleContents(user),
    getGlobalContents(user),
    getUserBookmarks(session.user.id),
    getUserProgressMap(session.user.id),
  ])

  const categories = await prisma.libraryCategory.findMany({
    where: { OR: [{ schoolId: user.schoolId }, { schoolId: null }], isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, color: true },
  })

  const contentsWithProgress = contents
    .filter((c) => c.status === "PUBLISHED")
    .map((c) => ({
      id: c.id,
      title: c.title,
      type: c.type,
      thumbnail: c.thumbnail,
      category: c.category,
      progress: progressMap.get(c.id) ?? 0,
    }))

  const globalContentsWithProgress = globalContents
    .filter((c) => c.status === "PUBLISHED")
    .map((c) => ({
      id: c.id,
      title: c.title,
      type: c.type,
      thumbnail: c.thumbnail,
      category: c.category,
      progress: progressMap.get(c.id) ?? 0,
    }))

  return (
    <LibraryPageClient
      collections={collections.map((c) => ({ ...c, _count: c._count as any }))}
      contents={contentsWithProgress}
      globalContents={globalContentsWithProgress}
      categories={categories}
      bookmarks={bookmarks}
      basePath="/teacher/library"
    />
  )
}
