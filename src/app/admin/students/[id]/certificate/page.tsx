// src/app/admin/students/[id]/certificate/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { CertificateViewer } from "@/components/certificate/CertificateViewer"
import type { StudentCertData, SchoolCertData, CertificateTemplate } from "@/components/certificate/types"

export default async function StudentCertificatePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) redirect("/login")

  const { id } = await params

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      user: { select: { fullName: true, fullNameAr: true, schoolId: true } },
      group: { select: { name: true, level: true } },
      memorizedSurahs: { include: { surah: { select: { nameFr: true, nameAr: true } } } },
      teacher: { include: { user: { select: { fullName: true, fullNameAr: true } } } },
      evaluations: { select: { finalScore: true, tajwid: true, makhraj: true, waqf: true, tarteel: true } },
      attendances: { select: { status: true } },
    },
  })

  if (!student || student.user.schoolId !== session.user.schoolId) notFound()

  const school = await prisma.school.findUnique({
    where: { id: session.user.schoolId! },
    select: { name: true, nameAr: true, logo: true, city: true, slug: true, directorSignature: true, teacherSignature: true },
  })

  const templateRows = await prisma.certificateTemplate.findMany({
    where: { schoolId: session.user.schoolId! },
    orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }],
  })

  const defaultTemplateRow = templateRows[0]
  if (!defaultTemplateRow) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl font-bold text-gray-800">Aucun template de certificat</h1>
        <p className="text-gray-500 mt-2">Créez un template dans Paramètres &gt; Certificats.</p>
      </div>
    )
  }

  const template: CertificateTemplate = {
    ...defaultTemplateRow,
    config: defaultTemplateRow.config as any,
  }

  const studentData: StudentCertData = {
    id: student.id,
    fullName: student.user.fullName,
    fullNameAr: student.user.fullNameAr ?? undefined,
    totalStars: student.totalStars,
    currentStreak: student.currentStreak,
    memorizedCount: student.memorizedSurahs.length,
    level: student.group?.level ?? "",
    groupName: student.group?.name ?? undefined,
    teacherName: student.teacher?.user.fullName ?? undefined,
    studentCode: student.studentCode,
    memorizedSurahs: student.memorizedSurahs.map((m) => ({
      id: m.surahId,
      nameFr: m.surah.nameFr,
      nameAr: m.surah.nameAr,
    })),
    avgScore:
      student.evaluations.length > 0
        ? Math.round(student.evaluations.reduce((s, e) => s + e.finalScore, 0) / student.evaluations.length)
        : undefined,
    tajwidScore:
      student.evaluations.length > 0
        ? Math.round(student.evaluations.reduce((s, e) => s + (e.tajwid || 0), 0) / student.evaluations.length)
        : undefined,
    attendanceRate:
      student.attendances.length > 0
        ? Math.round(
            (student.attendances.filter((a) => a.status === "PRESENT" || a.status === "LATE").length /
              student.attendances.length) *
              100
          )
        : undefined,
  }

  const schoolData: SchoolCertData = {
    name: school?.name ?? "TAHFIDZ",
    nameAr: school?.nameAr ?? undefined,
    logo: school?.logo ?? undefined,
    city: school?.city ?? undefined,
    slug: school?.slug ?? undefined,
    directorSignature: school?.directorSignature,
    teacherSignature: school?.teacherSignature,
  }

  return <CertificateViewer student={studentData} school={schoolData} template={template} />
}
