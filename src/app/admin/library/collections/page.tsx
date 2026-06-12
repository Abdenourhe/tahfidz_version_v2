// src/app/admin/library/collections/page.tsx

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { CollectionListClient } from "@/components/admin/library/CollectionListClient"

export default async function CollectionsPage() {
  const session = await auth()
  if (!session?.user || !["ADMIN", "SUPERADMIN", "TEACHER"].includes(session.user.role)) {
    redirect("/login")
  }

  const schoolId = session.user.schoolId
  if (!schoolId) redirect("/login")

  const collections = await prisma.libraryCollection.findMany({
    where: { schoolId },
    orderBy: { createdAt: "desc" },
    include: {
      group: { select: { id: true, name: true } },
      _count: { select: { contents: true, enrollments: true } },
    },
  })

  return <CollectionListClient collections={collections} />
}
