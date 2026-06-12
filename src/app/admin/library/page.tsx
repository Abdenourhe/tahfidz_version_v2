// src/app/admin/library/page.tsx

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { LibraryDashboardClient } from "@/components/admin/library/LibraryDashboardClient"

export default async function LibraryAdminPage() {
  const session = await auth()
  if (!session?.user || !["ADMIN", "SUPERADMIN", "TEACHER"].includes(session.user.role)) {
    redirect("/login")
  }

  const schoolId = session.user.schoolId
  if (!schoolId) redirect("/login")

  const [
    collectionsCount,
    contentsCount,
    categoriesCount,
    episodesCount,
    bookmarksCount,
    inProgressCount,
  ] = await Promise.all([
    prisma.libraryCollection.count({ where: { schoolId } }),
    prisma.libraryContent.count({ where: { schoolId } }),
    prisma.libraryCategory.count({ where: { OR: [{ schoolId }, { schoolId: null }] } }),
    prisma.libraryEpisode.count({ where: { content: { schoolId } } }),
    prisma.userBookmark.count({ where: { content: { schoolId } } }),
    prisma.userContentProgress.count({
      where: { content: { schoolId }, isCompleted: false, progress: { gt: 0 } },
    }),
  ])

  return (
    <LibraryDashboardClient
      collectionsCount={collectionsCount}
      contentsCount={contentsCount}
      categoriesCount={categoriesCount}
      episodesCount={episodesCount}
      bookmarksCount={bookmarksCount}
      inProgressCount={inProgressCount}
    />
  )
}
