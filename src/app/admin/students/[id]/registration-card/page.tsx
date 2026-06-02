import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { RegistrationCard } from "@/components/admin/RegistrationCard"

export default async function RegistrationCardPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) redirect("/login")

  const { id } = await params
  const schoolId = session.user.schoolId

  const student = await prisma.student.findUnique({
    where: { id },
    select: {
      id: true,
      studentCode: true,
      emergencyPhone: true,
      dateOfBirth: true,
      address: true,
      city: true,
      postalCode: true,
      medicalNotes: true,
      currentSurahNote: true,
      nationality: true,
      spokenLanguages: true,
      user: { select: { fullName: true, fullNameAr: true, email: true, phone: true, gender: true, createdAt: true, isActive: true, avatar: true } },
      group: { select: { name: true, level: true, schedule: true } },
      teacher: { include: { user: { select: { fullName: true } } } },
      parentLinks: {
        include: { parent: { include: { user: { select: { fullName: true, email: true, phone: true } } } } },
        where: { isVerified: true },
      },
    },
  })

  if (!student) notFound()

  const invite = await prisma.parentInvite.findUnique({
    where: { studentId: id },
    select: { code: true, used: true },
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const inviteUrl = invite && !invite.used
    ? `${appUrl}/parent/register?invite=${invite.code}&student=${student.studentCode}`
    : null

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { name: true, logo: true, slug: true, address: true, city: true, phone: true },
  })

  return (
    <RegistrationCard
      student={student}
      inviteUrl={inviteUrl}
      school={{
        name: school?.name || "TAHFIDZ",
        logo: school?.logo,
        slug: school?.slug || "",
        address: school?.address,
        city: school?.city,
        phone: school?.phone,
      }}
    />
  )
}
