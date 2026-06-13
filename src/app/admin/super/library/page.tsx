// src/app/admin/super/library/page.tsx
// Liste des contenus globaux (visibles par toutes les écoles)

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { SuperAdminLibraryClient } from "@/components/admin/superadmin/SuperAdminLibraryClient"

export default async function SuperAdminLibraryPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    redirect("/login")
  }

  const contents = await prisma.libraryContent.findMany({
    where: { visibility: "GLOBAL" },
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { id: true, name: true, color: true } },
      _count: { select: { episodes: true } },
    },
  })

  return <SuperAdminLibraryClient contents={contents as any} />
}
