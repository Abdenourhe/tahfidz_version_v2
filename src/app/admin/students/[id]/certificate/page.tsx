// src/app/admin/students/[id]/certificate/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { readFileSync } from "fs"
import { join } from "path"
import { CertificatePrint, type Templates } from "@/components/admin/certificate"

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
    primaryColor: "#1a5f4a", accentColor: "#c9a227", lightColor: "#f0f7f4", textColor: "#0d3326",
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
    primaryColor: "#2d5a3d", accentColor: "#d4a843", lightColor: "#f5f0e6", textColor: "#1a3d2e",
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
    primaryColor: "#8b4513", accentColor: "#daa520", lightColor: "#faf5ef", textColor: "#3d2314",
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
  attendance: {
    id: "islamic", title: "Certificat d'Assiduité", titleAr: "شَهَادَةُ الْحُضُور",
    subtitle: "Reconnaissance de présence",
    bodyText: "Pour avoir fait preuve d'une assiduité exemplaire et d'un engagement constant dans son parcours d'apprentissage du Saint Coran.",
    arabicVerse: "إِنَّمَا يَخْشَى اللَّهَ مِنْ عِبَادِهِ الْعُلَمَاءُ",
    primaryColor: "#065f46", accentColor: "#10b981", lightColor: "#ecfdf5", textColor: "#064e3b",
    badgeEmoji: "📅",
    borderStyle: "islamic", fontFamily: "Georgia", fontFamilyAr: "Amiri",
    decorativePattern: "geometric", signatureStyle: "elegant", paperTexture: "parchment",
    orientation: "portrait",
    directorName: "Directeur", directorNameAr: "المدير",
    showTeacher: false, teacherName: "", teacherNameAr: "",
  },
  participation: {
    id: "andalous", title: "Certificat de Participation", titleAr: "شَهَادَةُ الْمُشَارَكَة",
    subtitle: "Engagement et contribution",
    bodyText: "Pour avoir démontré un esprit de participation active, de collaboration fraternelle et d'implication remarquable dans la vie de l'école.",
    arabicVerse: "وَاعْتَصِمُوا بِحَبْلِ اللَّهِ جَمِيعًا وَلَا تَفَرَّقُوا",
    primaryColor: "#1e40af", accentColor: "#3b82f6", lightColor: "#eff6ff", textColor: "#1e3a8a",
    badgeEmoji: "🤝",
    borderStyle: "andalous", fontFamily: "Georgia", fontFamilyAr: "Amiri",
    decorativePattern: "floral", signatureStyle: "calligraphic", paperTexture: "cream",
    orientation: "portrait",
    directorName: "Directeur", directorNameAr: "المدير",
    showTeacher: false, teacherName: "", teacherNameAr: "",
  },
}

function loadTemplates(): Templates {
  try {
    const raw = readFileSync(join(process.cwd(), "src/data/certificateTemplates.json"), "utf-8")
    const parsed = JSON.parse(raw)
    if (parsed.beginner && parsed.intermediate && parsed.advanced && parsed.expert && parsed.attendance && parsed.participation) return parsed as Templates
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
      evaluations: { select: { finalScore: true, tajwid: true, makhraj: true, waqf: true, tarteel: true } },
      attendances: { select: { status: true } },
      memorizationProgress: { include: { surah: { select: { nameFr: true } } }, where: { status: "MEMORIZED" } },
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

  return (
    <CertificatePrint
      student={{
        id: student.id,
        fullName: student.user.fullName,
        fullNameAr: student.user.fullNameAr ?? undefined,
        totalStars: student.totalStars,
        currentStreak: student.currentStreak,
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
        avgScore: student.evaluations.length > 0
          ? Math.round(student.evaluations.reduce((s, e) => s + e.finalScore, 0) / student.evaluations.length)
          : undefined,
        tajwidScore: student.evaluations.length > 0
          ? Math.round(student.evaluations.reduce((s, e) => s + (e.tajwid || 0), 0) / student.evaluations.length)
          : undefined,
        attendanceRate: student.attendances.length > 0
          ? Math.round((student.attendances.filter(a => a.status === "PRESENT" || a.status === "LATE").length / student.attendances.length) * 100)
          : undefined,
      }}
      school={{ 
        name: school?.name ?? "TAHFIDZ", 
        nameAr: school?.nameAr ?? undefined,
        logo: school?.logo ?? undefined,
        city: school?.city ?? undefined,
        slug: school?.slug ?? undefined,
      }}
      templates={templates}
      activeKey={levelKey}
    />
  )
}