// src/app/admin/teachers/[id]/edit/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { TeacherEditForm } from "./TeacherEditForm"

export default async function EditTeacherPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login")

  const { id } = await params
  const schoolId = session.user.schoolId

  const teacher = await prisma.teacher.findUnique({
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

  if (!teacher) notFound()

  // Verify school ownership
  const userCheck = await prisma.user.findUnique({
    where: { id: teacher.userId },
    select: { schoolId: true },
  })
  if (!userCheck || userCheck.schoolId !== schoolId) notFound()

  return (
    <TeacherEditForm
      teacherId={teacher.id}
      initialData={{
        fullName: teacher.user.fullName,
        fullNameAr: teacher.user.fullNameAr ?? "",
        email: teacher.user.email,
        phone: teacher.user.phone ?? "",
        gender: teacher.user.gender ?? "",
        isActive: teacher.user.isActive,
        specialization: teacher.specialization ?? "",
        maxStudents: teacher.maxStudents,
        bio: teacher.bio ?? "",
      }}
    />
  )
}
