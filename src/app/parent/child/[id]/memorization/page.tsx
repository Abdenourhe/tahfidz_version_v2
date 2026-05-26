// src/app/parent/child/[id]/memorization/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import ParentMemorizationView from "@/components/parent/ParentMemorizationView"

export default async function ParentChildMemorizationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "PARENT") redirect("/login")

  const { id: childId } = await params

  // Vérifier que le parent est lié à cet enfant
  const parent = await prisma.parent.findUnique({
    where: { userId: session.user.id },
    include: { childrenLinks: { where: { studentId: childId, isVerified: true } } },
  })

  if (!parent || parent.childrenLinks.length === 0) {
    redirect("/parent/dashboard")
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <ParentMemorizationView childId={childId} />
    </div>
  )
}
