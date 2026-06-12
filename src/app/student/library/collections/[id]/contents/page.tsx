// src/app/student/library/collections/[id]/contents/page.tsx

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { CollectionContentsClient } from "@/components/library/CollectionContentsClient"
import { canAccessCollection, canAccessContent } from "@/lib/library/permissions"
import { getUserProgressMap } from "@/lib/library/access"

type Params = { params: Promise<{ id: string }> }

export default async function StudentCollectionContentsPage({ params }: Params) {
  const session = await auth()
  if (!session?.user || session.user.role !== "STUDENT") redirect("/login")

  const { id } = await params
  const collection = await prisma.libraryCollection.findUnique({
    where: { id },
    include: {
      contents: {
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        include: { category: { select: { id: true, name: true, color: true } }, _count: { select: { episodes: true } } },
      },
    },
  })

  if (!collection) redirect("/student/library")

  const user = { id: session.user.id, role: session.user.role as any, schoolId: session.user.schoolId }
  const accessible = await canAccessCollection(user, collection as any)
  if (!accessible) redirect("/student/library")

  const progressMap = await getUserProgressMap(session.user.id)
  const contentsWithProgress = collection.contents.map((c) => ({
    id: c.id,
    title: c.title,
    type: c.type,
    thumbnail: c.thumbnail,
    category: c.category,
    progress: progressMap.get(c.id) ?? 0,
  }))

  return (
    <CollectionContentsClient
      collection={collection}
      contents={contentsWithProgress}
      basePath="/student/library"
    />
  )
}
