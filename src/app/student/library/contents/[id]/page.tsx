// src/app/student/library/contents/[id]/page.tsx

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ContentViewerClient } from "@/components/library/ContentViewerClient"

type Params = { params: Promise<{ id: string }> }

export default async function StudentContentPage({ params }: Params) {
  const session = await auth()
  if (!session?.user || session.user.role !== "STUDENT") redirect("/login")

  const { id } = await params
  return <ContentViewerClient contentId={id} basePath="/student/library" />
}
