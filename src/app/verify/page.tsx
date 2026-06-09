// src/app/verify/page.tsx
// Page publique de vérification de certificat (scan QR)

import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { CertificateViewer } from "@/components/certificate/CertificateViewer"
import type { StudentCertData, SchoolCertData, CertificateTemplate } from "@/components/certificate/types"

interface Props {
  searchParams: Promise<{ student?: string; school?: string }>
}

export default async function VerifyPage({ searchParams }: Props) {
  const { student: studentParam, school: schoolSlug } = await searchParams
  if (!studentParam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Vérification de certificat</h1>
          <p className="text-gray-500 mt-2">Paramètre student manquant.</p>
        </div>
      </div>
    )
  }

  // Rechercher l'élève par studentCode ou par ID
  let student = await prisma.student.findFirst({
    where: { studentCode: studentParam },
    include: {
      user: { select: { fullName: true, fullNameAr: true, schoolId: true } },
      group: { select: { name: true, level: true } },
      memorizedSurahs: { include: { surah: { select: { nameFr: true, nameAr: true } } } },
      teacher: { include: { user: { select: { fullName: true, fullNameAr: true } } } },
      evaluations: { select: { finalScore: true, tajwid: true, makhraj: true, waqf: true, tarteel: true } },
      attendances: { select: { status: true } },
    },
  })

  if (!student) {
    student = await prisma.student.findUnique({
      where: { id: studentParam },
      include: {
        user: { select: { fullName: true, fullNameAr: true, schoolId: true } },
        group: { select: { name: true, level: true } },
        memorizedSurahs: { include: { surah: { select: { nameFr: true, nameAr: true } } } },
        teacher: { include: { user: { select: { fullName: true, fullNameAr: true } } } },
        evaluations: { select: { finalScore: true, tajwid: true, makhraj: true, waqf: true, tarteel: true } },
        attendances: { select: { status: true } },
      },
    })
  }

  if (!student) notFound()

  const school = await prisma.school.findUnique({
    where: { id: student.user.schoolId },
    select: { name: true, nameAr: true, logo: true, city: true, slug: true, directorSignature: true, teacherSignature: true },
  })

  if (schoolSlug && school?.slug !== schoolSlug) notFound()

  const templateRows = await prisma.certificateTemplate.findMany({
    where: { schoolId: student.user.schoolId },
    orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }],
  })

  if (templateRows.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Certificat introuvable</h1>
          <p className="text-gray-500 mt-2">Aucun template n'est configuré pour cette école.</p>
        </div>
      </div>
    )
  }

  const templates: CertificateTemplate[] = templateRows.map((r) => ({
    ...r,
    config: r.config as any,
  }))

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

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-8">
      <CertificateViewer
        student={studentData}
        school={schoolData}
        templates={templates}
        defaultTemplateId={templates[0].id}
        hideToolbar
      />
    </div>
  )
}
