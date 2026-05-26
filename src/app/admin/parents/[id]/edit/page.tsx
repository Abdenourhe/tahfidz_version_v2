// src/app/admin/parents/[id]/edit/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { ParentEditForm } from "./ParentEditForm"

export default async function EditParentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login")

  const { id } = await params
  const schoolId = session.user.schoolId

  const parent = await prisma.parent.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          fullName: true,
          fullNameAr: true,
          email: true,
          phone: true,
          gender: true,
          isActive: true,
        },
      },
    },
  })

  if (!parent) notFound()

  const userCheck = await prisma.user.findUnique({
    where: { id: parent.userId },
    select: { schoolId: true },
  })
  if (!userCheck || userCheck.schoolId !== schoolId) notFound()

  return (
    <ParentEditForm
      parentId={parent.id}
      initialData={{
        fullName: parent.user.fullName,
        fullNameAr: parent.user.fullNameAr ?? "",
        email: parent.user.email,
        phone: parent.user.phone ?? "",
        gender: parent.user.gender ?? "",
        isActive: parent.user.isActive,
      }}
    />
  )
}
