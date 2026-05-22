// src/app/admin/students/[id]/certificate/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { readFileSync } from "fs"
import { join } from "path"
import { CertificatePrint, type CertTemplate, type Templates } from "@/components/admin/certificate"

const LEVEL_LABEL: Record<string, string> = {
  beginner:     "Débutant",
  intermediate: "Intermédiaire",
  advanced:     "Avancé",
}

const LEVEL_KEY_MAP: Record<string, keyof Templates> = {
  "Débutant":      "beginner",
  "Intermédiaire": "intermediate",
  "Avancé":        "advanced",
  beginner:        "beginner",
  intermediate:    "intermediate",
  advanced:        "advanced",
}

const DEFAULT_TEMPLATES: Templates = {
  beginner: {
    id: "islamic", title: "Certificat de Mémorisation", titleAr: "شَهَادَةُ الْحِفْظ",
    subtitle: "Niveau Débutant",
    bodyText: "Pour avoir accompli avec sérieux et persévérance son programme de mémorisation du Saint Coran.",
    arabicVerse: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    primaryColor: "#10b981", accentColor: "#059669", lightColor: "#d1fae5", textColor: "#065f46",
    badgeEmoji: "🌱",
    borderStyle: "islamic", fontFamily: "Amiri", fontFamilyAr: "Scheherazade New",
    decorativePattern: "geometric", signatureStyle: "elegant", paperTexture: "parchment",
    orientation: "portrait",
    directorName: "Directeur", directorNameAr: "المدير",
    showTeacher: true, teacherName: "", teacherNameAr: "",
  },
  intermediate: {
    id: "andalous", title: "Certificat d'Excellence", titleAr: "شَهَادَةُ التَّفَوُّق",
    subtitle: "Niveau Intermédiaire",
    bodyText: "Pour avoir accompli avec brio son programme de mémorisation du Saint Coran.",
    arabicVerse: "وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا",
    primaryColor: "#d97706", accentColor: "#b45309", lightColor: "#fef3c7", textColor: "#78350f",
    badgeEmoji: "⭐",
    borderStyle: "andalous", fontFamily: "Georgia", fontFamilyAr: "Amiri",
    decorativePattern: "floral", signatureStyle: "calligraphic", paperTexture: "cream",
    orientation: "portrait",
    directorName: "Directeur", directorNameAr: "المدير",
    showTeacher: true, teacherName: "", teacherNameAr: "",
  },
  advanced: {
    id: "ottoman", title: "Certificat d'Honneur", titleAr: "شَهَادَةُ الشَّرَف",
    subtitle: "Niveau Avancé",
    bodyText: "Pour avoir maîtrisé avec distinction son programme avancé de mémorisation du Saint Coran.",
    arabicVerse: "إِنَّ هَذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ",
    primaryColor: "#7c3aed", accentColor: "#6d28d9", lightColor: "#ede9fe", textColor: "#4c1d95",
    badgeEmoji: "🏆",
    borderStyle: "ottoman", fontFamily: "Georgia", fontFamilyAr: "Scheherazade New",
    decorativePattern: "ornate", signatureStyle: "royal", paperTexture: "vintage",
    orientation: "portrait",
    directorName: "Directeur", directorNameAr: "المدير",
    showTeacher: true, teacherName: "", teacherNameAr: "",
  },
  expert: {
    id: "mamlouk", title: "Certificat de Maîtrise", titleAr: "شَهَادَةُ الْإِتْقَان",
    subtitle: "Niveau Expert",
    bodyText: "Pour avoir atteint la maîtrise complète de la mémorisation du Saint Coran avec ijtihad et perfection.",
    arabicVerse: "نَحْنُ نَقُصُّ عَلَيْكَ أَحْسَنَ الْقَصَصِ",
    primaryColor: "#1e3a5f", accentColor: "#4a90a4", lightColor: "#eef4f8", textColor: "#0f1f33",
    badgeEmoji: "👑",
    borderStyle: "mamlouk", fontFamily: "Georgia", fontFamilyAr: "Reem Kufi",
    decorativePattern: "architectural", signatureStyle: "imperial", paperTexture: "linen",
    orientation: "landscape",
    directorName: "Directeur", directorNameAr: "المدير",
    showTeacher: true, teacherName: "", teacherNameAr: "",
  },
}

function loadTemplates(): Templates {
  try {
    const raw = readFileSync(join(process.cwd(), "src/data/certificateTemplates.json"), "utf-8")
    const parsed = JSON.parse(raw)
    if (parsed.beginner && parsed.intermediate && parsed.advanced && parsed.expert) return parsed as Templates
    return DEFAULT_TEMPLATES
  } catch {
    return DEFAULT_TEMPLATES
  }
}

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
    },
  })

  if (!student || student.user.schoolId !== session.user.schoolId) notFound()

  const school = await prisma.school.findUnique({
    where: { id: session.user.schoolId! },
    select: { name: true, nameAr: true, logo: true, city: true, slug: true },
  })

  const templates = loadTemplates()
  const levelKey = student.group?.level
    ? (LEVEL_KEY_MAP[student.group.level] ?? "beginner")
    : "beginner"
  const template: CertTemplate = templates[levelKey] ?? templates.beginner

  return (
    <CertificatePrint
      student={{
        id: student.id,
        fullName: student.user.fullName,
        fullNameAr: student.user.fullNameAr ?? undefined,
        totalStars: student.totalStars,
        memorizedCount: student.memorizedSurahs.length,
        level: student.group?.level ? (LEVEL_LABEL[student.group.level] ?? student.group.level) : "beginner",
        groupName: student.group?.name ?? undefined,
        teacherName: student.teacher?.user.fullName ?? undefined,
        studentCode: student.studentCode,
        memorizedSurahs: student.memorizedSurahs.map(m => ({
          id: m.surahId,
          nameFr: m.surah.nameFr,
          nameAr: m.surah.nameAr,
        })),
      }}
      school={{ 
        name: school?.name ?? "TAHFIDZ", 
        nameAr: school?.nameAr ?? undefined,
        logo: school?.logo ?? undefined,
        city: school?.city ?? undefined,
        slug: school?.slug ?? undefined,
      }}
      template={template}
    />
  )
}