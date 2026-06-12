// src/app/admin/library/collections/[id]/edit/page.tsx

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { CollectionForm } from "@/components/admin/library/CollectionForm"

type Params = { params: Promise<{ id: string }> }

export default async function EditCollectionPage({ params }: Params) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "SUPERADMIN", "TEACHER"].includes(session.user.role)) {
    redirect("/login")
  }

  const schoolId = session.user.schoolId
  if (!schoolId) redirect("/login")

  const { id } = await params
  const collection = await prisma.libraryCollection.findUnique({ where: { id } })
  if (!collection || collection.schoolId !== schoolId) redirect("/admin/library/collections")

  const groups = await prisma.group.findMany({
    where: { schoolId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  return <CollectionForm groups={groups} collection={collection} />
}
