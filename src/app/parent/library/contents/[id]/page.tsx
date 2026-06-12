// src/app/parent/library/contents/[id]/page.tsx

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ContentViewerClient } from "@/components/library/ContentViewerClient"

type Params = { params: Promise<{ id: string }> }

export default async function ParentContentPage({ params }: Params) {
  const session = await auth()
  if (!session?.user || session.user.role !== "PARENT") redirect("/login")

  const { id } = await params
  return <ContentViewerClient contentId={id} basePath="/parent/library" />
}
