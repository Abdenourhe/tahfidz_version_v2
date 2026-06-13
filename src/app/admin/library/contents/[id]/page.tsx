// src/app/admin/library/contents/[id]/page.tsx
// Visualisation d'un contenu pour l'admin (école ou global)

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ContentViewerClient } from "@/components/library/ContentViewerClient"

type Params = { params: Promise<{ id: string }> }

export default async function AdminContentPage({ params }: Params) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "SUPERADMIN", "TEACHER"].includes(session.user.role)) {
    redirect("/login")
  }

  const { id } = await params
  return <ContentViewerClient contentId={id} basePath="/admin/library" />
}
