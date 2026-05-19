// src/app/parent/child/[id]/page.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ParentChildProfileClient } from "@/components/parent/ParentChildProfileClient"

export default async function ParentChildPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "PARENT") redirect("/login")

  const { id } = await params
  return <ParentChildProfileClient studentId={id} />
}
