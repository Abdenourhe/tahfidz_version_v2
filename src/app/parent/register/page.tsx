// src/app/parent/register/page.tsx
import { prisma } from "@/lib/prisma"
import { ParentRegisterForm } from "@/components/parent/ParentRegisterForm"

interface PageProps {
  searchParams: Promise<{ invite?: string; student?: string }>
}

export default async function ParentRegisterPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const inviteCode = sp.invite || ""
  const studentCode = sp.student || ""

  let inviteData: {
    valid: boolean
    error?: string
    studentName?: string
    studentNameAr?: string | null
    schoolName?: string
    schoolNameAr?: string | null
  } = { valid: false }

  if (inviteCode && studentCode) {
    const invite = await prisma.parentInvite.findUnique({
      where: { code: inviteCode.toUpperCase() },
      include: {
        student: {
          include: {
            user: { select: { fullName: true, fullNameAr: true } },
          },
        },
        school: { select: { name: true, nameAr: true } },
      },
    })

    if (!invite) {
      inviteData = { valid: false, error: "invalid" }
    } else if (invite.used) {
      inviteData = { valid: false, error: "used" }
    } else if (new Date() > invite.expiresAt) {
      inviteData = { valid: false, error: "expired" }
    } else if (invite.student.studentCode !== studentCode) {
      inviteData = { valid: false, error: "mismatch" }
    } else {
      inviteData = {
        valid: true,
        studentName: invite.student.user.fullName,
        studentNameAr: invite.student.user.fullNameAr,
        schoolName: invite.school.name,
        schoolNameAr: invite.school.nameAr,
      }
    }
  } else {
    inviteData = { valid: false, error: "missing" }
  }

  return (
    <ParentRegisterForm
      inviteCode={inviteCode}
      studentCode={studentCode}
      inviteData={inviteData}
    />
  )
}
