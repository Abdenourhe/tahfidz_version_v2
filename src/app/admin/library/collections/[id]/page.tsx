// src/app/admin/library/collections/[id]/page.tsx

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { CollectionDetailClient } from "@/components/admin/library/CollectionDetailClient"

type Params = { params: Promise<{ id: string }> }

export default async function CollectionDetailPage({ params }: Params) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "SUPERADMIN", "TEACHER"].includes(session.user.role)) {
    redirect("/login")
  }

  const schoolId = session.user.schoolId
  if (!schoolId) redirect("/login")

  const { id } = await params
  const collection = await prisma.libraryCollection.findUnique({
    where: { id },
    include: {
      group: { select: { id: true, name: true } },
      contents: {
        orderBy: { createdAt: "desc" },
        include: { category: { select: { id: true, name: true, color: true } }, _count: { select: { episodes: true } } },
      },
      enrollments: { include: { student: { include: { user: { select: { fullName: true, email: true } } } } } },
    },
  })

  if (!collection || collection.schoolId !== schoolId) redirect("/admin/library/collections")

  const enrolledStudentIds = collection.enrollments.map((e) => e.studentId)
  const availableStudents = collection.groupId
    ? []
    : await prisma.student.findMany({
        where: {
          user: { schoolId },
          id: { notIn: enrolledStudentIds.length ? enrolledStudentIds : undefined },
        },
        include: { user: { select: { id: true, fullName: true, email: true } } },
        orderBy: { user: { fullName: "asc" } },
      })

  return <CollectionDetailClient collection={collection} availableStudents={availableStudents} />
}
