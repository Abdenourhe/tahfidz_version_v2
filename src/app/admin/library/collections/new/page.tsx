// src/app/admin/library/collections/new/page.tsx

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { CollectionForm } from "@/components/admin/library/CollectionForm"

export default async function NewCollectionPage() {
  const session = await auth()
  if (!session?.user || !["ADMIN", "SUPERADMIN", "TEACHER"].includes(session.user.role)) {
    redirect("/login")
  }

  const schoolId = session.user.schoolId
  if (!schoolId) redirect("/login")

  const groups = await prisma.group.findMany({
    where: { schoolId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  return <CollectionForm groups={groups} />
}
