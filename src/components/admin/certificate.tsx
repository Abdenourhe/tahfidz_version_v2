"use client"
// src/components/admin/certificate.tsx
// Version professionnelle améliorée — design certificat premium

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import { useLanguage } from "@/contexts/LanguageContext"
import {
  ArrowLeft, Save, CheckCircle2, Loader2, RotateCcw, Eye, Palette, Type,
  Sparkles, BookOpen, LayoutTemplate, UserCheck, Printer, Award, QrCode,
} from "lucide-react"

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type CertTemplate = {
  id: string
  title: string
  titleAr: string
  subtitle: string
  bodyText: string
  arabicVerse: string
  primaryColor: string
  accentColor: string
  lightColor: string
  textColor: string
  badgeEmoji: string
  borderStyle: string
  fontFamily: string
  fontFamilyAr: string
  decorativePattern: string
  signatureStyle: string
  paperTexture: string
  orientation: "portrait" | "landscape"
  directorName: string
  directorNameAr: string
  showTeacher: boolean
  teacherName: string
  teacherNameAr: string
}

export type Templates = {
  beginner: CertTemplate
  intermediate: CertTemplate
  advanced: CertTemplate
  expert: CertTemplate
  attendance: CertTemplate
  participation: CertTemplate
}

// ═══════════════════════════════════════════════════════════════════════════
// MÉTADONNÉES DES TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════

const TEMPLATE_META = {
  beginner:      { label: { fr: "🌱 Débutant",      en: "🌱 Beginner",      ar: "🌱 مبتدئ" },      emoji: "🌱", style: "islamic" },
  intermediate:  { label: { fr: "⭐ Intermédiaire",  en: "⭐ Intermediate",  ar: "⭐ متوسط" },      emoji: "⭐", style: "andalous" },
  advanced:      { label: { fr: "🏆 Avancé",        en: "🏆 Advanced",      ar: "🏆 متقدم" },      emoji: "🏆", style: "ottoman" },
  expert:        { label: { fr: "👑 Expert",         en: "👑 Expert",        ar: "👑 خبير" },       emoji: "👑", style: "mamlouk" },
  attendance:    { label: { fr: "📅 Assiduité",      en: "📅 Attendance",     ar: "📅 الحضور" },     emoji: "📅", style: "islamic" },
  participation: { label: { fr: "🤝 Participation",  en: "🤝 Participation", ar: "🤝 المشاركة" },   emoji: "🤝", style: "andalous" },
}

const STYLE_PRESETS: Record<string, { name: string; colors: string[]; pattern: string; font: string; fontAr: string }> = {
  islamic:  { name: "Islamique Géométrique", colors: ["#1a5f4a", "#c9a227", "#f0f7f4", "#0d3326"], pattern: "geometric",     font: "Amiri",   fontAr: "Scheherazade New" },
  andalous: { name: "Andalou Floral",        colors: ["#2d5a3d", "#d4a843", "#f5f0e6", "#1a3d2e"], pattern: "floral",        font: "Georgia", fontAr: "Amiri" },
  ottoman:  { name: "Ottoman Royal",         colors: ["#8b4513", "#daa520", "#faf5ef", "#3d2314"], pattern: "ornate",        font: "Georgia", fontAr: "Scheherazade New" },
  mamlouk:  { name: "Mamlouk Architectural", colors: ["#1e3a5f", "#4a90a4", "#eef4f8", "#0f1f33"], pattern: "architectural", font: "Georgia", fontAr: "Reem Kufi" },
}

const DEFAULTS: Templates = {
  beginner: {
    id: "islamic", title: "Certificat de Mémorisation", titleAr: "شَهَادَةُ الْحِفْظ",
    subtitle: "Niveau Débutant",
    bodyText: "Pour avoir accompli avec sérieux et persévérance son programme de mémorisation du Saint Coran, et avoir démontré de belles qualités d'apprentissage.",
    arabicVerse: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    primaryColor: "#1a5f4a", accentColor: "#c9a227", lightColor: "#f0f7f4", textColor: "#0d3326",
    badgeEmoji: "🌱", borderStyle: "islamic", fontFamily: "Amiri", fontFamilyAr: "Scheherazade New",
    decorativePattern: "geometric", signatureStyle: "elegant", paperTexture: "parchment", orientation: "portrait",
    directorName: "Directeur", directorNameAr: "المدير", showTeacher: true, teacherName: "", teacherNameAr: "",
  },
  intermediate: {
    id: "andalous", title: "Certificat d'Excellence", titleAr: "شَهَادَةُ التَّفَوُّق",
    subtitle: "Niveau Intermédiaire",
    bodyText: "Pour avoir accompli avec brio et dévouement son programme de mémorisation du Saint Coran, et avoir atteint un niveau remarquable de récitation.",
    arabicVerse: "وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا",
    primaryColor: "#2d5a3d", accentColor: "#d4a843", lightColor: "#f5f0e6", textColor: "#1a3d2e",
    badgeEmoji: "⭐", borderStyle: "andalous", fontFamily: "Georgia", fontFamilyAr: "Amiri",
    decorativePattern: "floral", signatureStyle: "calligraphic", paperTexture: "cream", orientation: "portrait",
    directorName: "Directeur", directorNameAr: "المدير", showTeacher: true, teacherName: "", teacherNameAr: "",
  },
  advanced: {
    id: "ottoman", title: "Certificat d'Honneur", titleAr: "شَهَادَةُ الشَّرَف",
    subtitle: "Niveau Avancé",
    bodyText: "Pour avoir maîtrisé avec distinction et excellence son programme avancé de mémorisation du Saint Coran, et avoir fait preuve d'une dévotion exemplaire.",
    arabicVerse: "إِنَّ هَذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ",
    primaryColor: "#8b4513", accentColor: "#daa520", lightColor: "#faf5ef", textColor: "#3d2314",
    badgeEmoji: "🏆", borderStyle: "ottoman", fontFamily: "Georgia", fontFamilyAr: "Scheherazade New",
    decorativePattern: "ornate", signatureStyle: "royal", paperTexture: "vintage", orientation: "portrait",
    directorName: "Directeur", directorNameAr: "المدير", showTeacher: true, teacherName: "", teacherNameAr: "",
  },
  expert: {
    id: "mamlouk", title: "Certificat de Maîtrise", titleAr: "شَهَادَةُ الْإِتْقَان",
    subtitle: "Niveau Expert",
    bodyText: "Pour avoir atteint la maîtrise complète de la mémorisation du Saint Coran avec ijtihad et perfection, et être devenu un modèle d'excellence spirituelle.",
    arabicVerse: "نَحْنُ نَقُصُّ عَلَيْكَ أَحْسَنَ الْقَصَصِ",
    primaryColor: "#1e3a5f", accentColor: "#4a90a4", lightColor: "#eef4f8", textColor: "#0f1f33",
    badgeEmoji: "👑", borderStyle: "mamlouk", fontFamily: "Georgia", fontFamilyAr: "Reem Kufi",
    decorativePattern: "architectural", signatureStyle: "imperial", paperTexture: "linen", orientation: "landscape",
    directorName: "Directeur", directorNameAr: "المدير", showTeacher: true, teacherName: "", teacherNameAr: "",
  },
  attendance: {
    id: "islamic", title: "Certificat d'Assiduité", titleAr: "شَهَادَةُ الْحُضُور",
    subtitle: "Reconnaissance de présence",
    bodyText: "Pour avoir fait preuve d'une assiduité exemplaire et d'un engagement constant dans son parcours d'apprentissage du Saint Coran.",
    arabicVerse: "إِنَّمَا يَخْشَى اللَّهَ مِنْ عِبَادِهِ الْعُلَمَاءُ",
    primaryColor: "#065f46", accentColor: "#10b981", lightColor: "#ecfdf5", textColor: "#064e3b",
    badgeEmoji: "📅", borderStyle: "islamic", fontFamily: "Georgia", fontFamilyAr: "Amiri",
    decorativePattern: "geometric", signatureStyle: "elegant", paperTexture: "parchment", orientation: "portrait",
    directorName: "Directeur", directorNameAr: "المدير", showTeacher: false, teacherName: "", teacherNameAr: "",
  },
  participation: {
    id: "andalous", title: "Certificat de Participation", titleAr: "شَهَادَةُ الْمُشَارَكَة",
    subtitle: "Engagement et contribution",
    bodyText: "Pour avoir démontré un esprit de participation active, de collaboration fraternelle et d'implication remarquable dans la vie de l'école.",
    arabicVerse: "وَاعْتَصِمُوا بِحَبْلِ اللَّهِ جَمِيعًا وَلَا تَفَرَّقُوا",
    primaryColor: "#1e40af", accentColor: "#3b82f6", lightColor: "#eff6ff", textColor: "#1e3a8a",
    badgeEmoji: "🤝", borderStyle: "andalous", fontFamily: "Georgia", fontFamilyAr: "Amiri",
    decorativePattern: "floral", signatureStyle: "calligraphic", paperTexture: "cream", orientation: "portrait",
    directorName: "Directeur", directorNameAr: "المدير", showTeacher: false, teacherName: "", teacherNameAr: "",
  },
}

// ═══════════════════════════════════════════════════════════════════════════
// TEXTURES DE PAPIER
// ═══════════════════════════════════════════════════════════════════════════

const PAPER_TEXTURES: Record<string, string> = {
  parchment: `radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.8) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(200,180,140,0.1) 0%, transparent 50%), linear-gradient(135deg, #f5f0e6 0%, #faf8f3 50%, #f0ebe0 100%)`,
  cream:     `radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.9) 0%, transparent 70%), linear-gradient(180deg, #fefcf8 0%, #f8f5ef 100%)`,
  vintage:   `radial-gradient(ellipse at 20% 30%, rgba(180,160,130,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(160,140,110,0.1) 0%, transparent 50%), linear-gradient(135deg, #f0e8d8 0%, #faf5ef 50%, #e8dfd0 100%)`,
  linen:     `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px), repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px), linear-gradient(135deg, #f5f3f0 0%, #faf9f7 100%)`,
}

// ═══════════════════════════════════════════════════════════════════════════
// DONNÉES ÉTUDIANT / ÉCOLE
// ═══════════════════════════════════════════════════════════════════════════

interface StudentData {
  id: string
  fullName: string
  fullNameAr?: string
  avatar?: string
  level: string
  groupName?: string
  teacherName?: string
  memorizedCount: number
  totalStars: number
  currentStreak?: number
  memorizedSurahs: { id: number; nameFr: string; nameAr: string }[]
  studentCode?: string
  avgScore?: number
  tajwidScore?: number
  attendanceRate?: number
}

interface SchoolData {
  name: string
  nameAr?: string
  logo?: string
  city?: string
  slug?: string
}


// ═══════════════════════════════════════════════════════════════════════════
// CERTIFICATE PRINT — VERSION PROFESSIONNELLE AMÉLIORÉE
// ═══════════════════════════════════════════════════════════════════════════

interface CertificatePrintProps {
  student: StudentData
  school: SchoolData
  templates: Templates
  activeKey?: keyof Templates
}

const DEFAULT_TEMPLATE: CertTemplate = DEFAULTS.beginner

export function CertificatePrint({ student, school, templates, activeKey: initialKey = "beginner" }: CertificatePrintProps) {
  const { locale } = useLanguage()
  const [activeKey, setActiveKey] = useState<keyof Templates>(initialKey)
  const [note, setNote] = useState("")
  const [isPrinting, setIsPrinting] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const certRef = useRef<HTMLDivElement>(null)

  const t = templates[activeKey] ?? DEFAULT_TEMPLATE
  const isLandscape = t.orientation === "landscape"
  const pageWidth   = isLandscape ? "297mm" : "210mm"
  const pageHeight  = isLandscape ? "210mm" : "297mm"
  const printSize   = isLandscape ? "297mm 210mm" : "210mm 297mm"

  const qrValue = student.studentCode && school.slug
    ? `${student.studentCode}|${school.slug}`
    : student.id

  useEffect(() => {
    import("qrcode").then((QRCode) => {
      QRCode.toDataURL(qrValue, { width: 80, margin: 1, color: { dark: t.primaryColor, light: "#ffffff" } })
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(null))
    }).catch(() => setQrDataUrl(null))
  }, [qrValue, t.primaryColor])

  // ─── Traductions certificat ───
  const certLabels = {
    fr: {
      awardedTo: "Ce certificat est décerné à",
      director: "Directeur",
      teacher: "Enseignant",
      date: "Date",
      verify: "Vérifier",
      presence: "Présence",
      series: "Série",
      stars: "Étoiles",
      level: "Niveau",
      surahs: "Sourates",
      average: "Moyenne",
      tajwid: "Tajwīd",
      group: "Groupe",
      footer: "TAHFIDZ",
    },
    en: {
      awardedTo: "This certificate is awarded to",
      director: "Director",
      teacher: "Teacher",
      date: "Date",
      verify: "Verify",
      presence: "Attendance",
      series: "Streak",
      stars: "Stars",
      level: "Level",
      surahs: "Surahs",
      average: "Average",
      tajwid: "Tajwid",
      group: "Group",
      footer: "TAHFIDZ",
    },
    ar: {
      awardedTo: "تُمنح هذه الشهادة لـ",
      director: "المدير",
      teacher: "المعلم",
      date: "التاريخ",
      verify: "تحقق",
      presence: "الحضور",
      series: "السلسلة",
      stars: "النجوم",
      level: "المستوى",
      surahs: "السور",
      average: "المعدل",
      tajwid: "التجويد",
      group: "المجموعة",
      footer: "TAHFIDZ",
    },
  }
  const L = (locale as "fr" | "en" | "ar") ?? "fr"
  const cl = certLabels[L]
  const isAr = L === "ar"

  const handlePrint = useCallback(() => {
    if (!certRef.current) return
    setIsPrinting(true)

    const clone = certRef.current.cloneNode(true) as HTMLElement
    clone.id = "certificate-print-clone"
    clone.style.position = "fixed"
    clone.style.top = "0"
    clone.style.left = "0"
    clone.style.margin = "0"
    clone.style.padding = "0"
    clone.style.boxShadow = "none"
    clone.style.zIndex = "99999"
    document.body.appendChild(clone)

    const style = document.createElement("style")
    style.id = "certificate-print-style"
    style.innerHTML = `
      @media print {
        @page { size: ${printSize}; margin: 0; }
        html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; overflow: hidden !important; background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        body > * { visibility: hidden !important; }
        #certificate-print-clone, #certificate-print-clone * { visibility: visible !important; }
        #certificate-print-clone {
          position: fixed !important; top: 0 !important; left: 0 !important;
          width: ${pageWidth} !important; height: ${pageHeight} !important;
          margin: 0 !important; padding: 0 !important;
          overflow: hidden !important; box-shadow: none !important;
          page-break-inside: avoid !important;
        }
        .no-print { display: none !important; }
      }
    `
    document.head.appendChild(style)

    setTimeout(() => {
      window.print()
      setTimeout(() => {
        const s = document.getElementById("certificate-print-style")
        if (s) document.head.removeChild(s)
        if (document.body.contains(clone)) document.body.removeChild(clone)
        setIsPrinting(false)
      }, 800)
    }, 400)
  }, [pageWidth, pageHeight, printSize])

  const today   = new Date().toLocaleDateString(L === "ar" ? "ar-SA" : L === "en" ? "en-US" : "fr-FR", { day: "numeric", month: "long", year: "numeric" })
  const todayAr = new Date().toLocaleDateString("ar-SA", { day: "numeric", month: "long", year: "numeric" })

  const paperBg = PAPER_TEXTURES[t.paperTexture] || PAPER_TEXTURES.parchment

  const isAttendance = activeKey === "attendance"
  const isParticipation = activeKey === "participation"

  const stats = isAttendance
    ? [
        ...(student.attendanceRate !== undefined ? [{ label: cl.presence, value: student.attendanceRate + "%", color: "#10b981", big: true }] : []),
        ...(student.currentStreak !== undefined && student.currentStreak > 0 ? [{ label: cl.series, value: student.currentStreak + (L === "ar" ? " أيام" : L === "en" ? " days" : " jours"), color: "#f59e0b" }] : []),
        { label: cl.stars, value: student.totalStars, color: t.accentColor },
      ]
    : isParticipation
    ? [
        { label: cl.stars, value: student.totalStars, color: t.accentColor, big: true },
        ...(student.currentStreak !== undefined && student.currentStreak > 0 ? [{ label: cl.series, value: student.currentStreak + (L === "ar" ? " أيام" : L === "en" ? " days" : " jours"), color: "#f59e0b" }] : []),
        { label: cl.level, value: student.level === "Débutant" || student.level === "beginner" ? "1" : student.level === "Intermédiaire" || student.level === "intermediate" ? "2" : student.level === "Avancé" || student.level === "advanced" ? "3" : "4", color: t.primaryColor },
      ]
    : [
        { label: cl.surahs, value: student.memorizedCount, color: t.primaryColor },
        { label: cl.stars,  value: student.totalStars,     color: t.accentColor },
        { label: cl.level,   value: student.level === "Débutant" || student.level === "beginner" ? "1" : student.level === "Intermédiaire" || student.level === "intermediate" ? "2" : student.level === "Avancé" || student.level === "advanced" ? "3" : "4", color: t.primaryColor },
        ...(student.avgScore !== undefined ? [{ label: cl.average, value: student.avgScore + "%", color: t.primaryColor }] : []),
        ...(student.attendanceRate !== undefined ? [{ label: cl.presence, value: student.attendanceRate + "%", color: "#10b981" }] : []),
        ...(student.tajwidScore !== undefined ? [{ label: cl.tajwid, value: student.tajwidScore + "%", color: t.accentColor }] : []),
      ]


  // ─── SVG PROFESSIONNELS ───

  const cornerSvg = (color: string, pos: "tl"|"tr"|"bl"|"br") => {
    const transform = pos === "tr" ? "scaleX(-1)" : pos === "bl" ? "scaleY(-1)" : pos === "br" ? "scale(-1)" : undefined
    const style: React.CSSProperties = {
      position: "absolute",
      width: "90px",
      height: "90px",
      color,
      pointerEvents: "none",
      zIndex: 5,
      ...(pos.startsWith("t") ? { top: "10px" } : { bottom: "10px" }),
      ...(pos.endsWith("l") ? { left: "10px" } : { right: "10px" }),
      ...(transform ? { transform } : {}),
    }
    return (
      <svg width="90" height="90" viewBox="0 0 90 90" style={style}>
        <path d="M0 36 Q0 0 36 0" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.55"/>
        <path d="M0 22 Q0 0 22 0" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.45"/>
        <path d="M0 50 L16 50 L16 38 Q16 16 38 16 L50 16 L50 0" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.4"/>
        <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.35"/>
        <path d="M28 0 L28 14 L14 14 L14 28 L0 28" fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.35"/>
        <path d="M44 0 L44 7 L7 7 L7 44 L0 44" fill="none" stroke="currentColor" strokeWidth="0.7" opacity="0.25"/>
        <circle cx="40" cy="7" r="2.5" fill="currentColor" opacity="0.3"/>
        <circle cx="7" cy="40" r="2.5" fill="currentColor" opacity="0.3"/>
        {/* Motif géométrique intérieur */}
        <path d="M20 20 L30 30 L20 40 L10 30 Z" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.2"/>
      </svg>
    )
  }

  const sealSvg = (color: string, accent: string) => (
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="46" fill="none" stroke={accent} strokeWidth="3" opacity="0.9"/>
      <circle cx="50" cy="50" r="40" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.5" strokeDasharray="5 3"/>
      <circle cx="50" cy="50" r="34" fill={accent} opacity="0.08"/>
      <text x="50" y="38" textAnchor="middle" fill={color} fontSize="11" fontWeight="bold" letterSpacing="2" fontFamily="Georgia,serif">TAHFIDZ</text>
      <text x="50" y="55" textAnchor="middle" fill={color} fontSize="10" fontWeight="bold" letterSpacing="1.2" fontFamily="Georgia,serif">AWARD</text>
      <path d="M38 65 L50 82 L62 65" fill="none" stroke={accent} strokeWidth="2.5" opacity="0.85"/>
      <path d="M40 67 L50 78 L60 67" fill={accent} opacity="0.4"/>
      <circle cx="50" cy="22" r="3" fill={accent} opacity="0.6"/>
      <circle cx="50" cy="78" r="3" fill={accent} opacity="0.6"/>
      {/* Étoiles décoratives */}
      <polygon points="50,8 52,14 58,14 53,18 55,24 50,20 45,24 47,18 42,14 48,14" fill={accent} opacity="0.5"/>
    </svg>
  )

  const lineSvg = (color: string) => (
    <svg width="220" height="16" viewBox="0 0 220 16" style={{ display: "block", margin: "0 auto" }}>
      <path d="M0 8 L85 8" stroke={color} strokeWidth="1" opacity="0.4"/>
      <path d="M135 8 L220 8" stroke={color} strokeWidth="1" opacity="0.4"/>
      <circle cx="110" cy="8" r="5" fill={color} opacity="0.35"/>
      <circle cx="110" cy="8" r="2" fill="white" opacity="0.9"/>
      {/* Petits ornements */}
      <circle cx="95" cy="8" r="2" fill={color} opacity="0.2"/>
      <circle cx="125" cy="8" r="2" fill={color} opacity="0.2"/>
    </svg>
  )

  const watermarkPattern = (color: string) => (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.04, pointerEvents: "none", zIndex: 1 }}>
      <defs>
        <pattern id="wm" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
          <circle cx="30" cy="30" r="20" fill="none" stroke={color} strokeWidth="0.6"/>
          <path d="M30 10 L30 50 M10 30 L50 30" stroke={color} strokeWidth="0.4"/>
          <circle cx="30" cy="30" r="4" fill={color} opacity="0.6"/>
          <path d="M30 14 L34 30 L30 46 L26 30 Z" fill="none" stroke={color} strokeWidth="0.3" opacity="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#wm)"/>
    </svg>
  )

  const borderFrameSvg = (color: string) => (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2 }}>
      <rect x="2" y="2" width="96" height="96" fill="none" stroke={color} strokeWidth="0.5" opacity="0.35" rx="0.5" vectorEffect="non-scaling-stroke"/>
      <rect x="3" y="3" width="94" height="94" fill="none" stroke={color} strokeWidth="0.2" opacity="0.2" rx="0.3" vectorEffect="non-scaling-stroke"/>
      {/* Coins doubles */}
      <path d="M2 8 L2 2 L8 2" fill="none" stroke={color} strokeWidth="0.6" opacity="0.5" vectorEffect="non-scaling-stroke"/>
      <path d="M92 2 L98 2 L98 8" fill="none" stroke={color} strokeWidth="0.6" opacity="0.5" vectorEffect="non-scaling-stroke"/>
      <path d="M2 92 L2 98 L8 98" fill="none" stroke={color} strokeWidth="0.6" opacity="0.5" vectorEffect="non-scaling-stroke"/>
      <path d="M92 98 L98 98 L98 92" fill="none" stroke={color} strokeWidth="0.6" opacity="0.5" vectorEffect="non-scaling-stroke"/>
    </svg>
  )


  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  PANNEAU DE CONTRÔLE (no-print)                               */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="space-y-4 no-print">
        <div className="flex items-center gap-3">
          <Link href={`/admin/students/${student.id}`} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
            <ArrowLeft size={18} className="text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {L === "ar" ? "الشهادة" : L === "en" ? "Certificate" : "Certificat"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{student.fullName}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3 flex items-center gap-3">
          <div className="border-2 border-current rounded flex-shrink-0" style={{ color: t.primaryColor, width: isLandscape ? "28px" : "20px", height: isLandscape ? "20px" : "28px" }}/>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {L === "ar" ? "التنسيق" : L === "en" ? "Format" : "Format"} : {isLandscape 
                ? (L === "ar" ? "أفقي (A4 أفقي)" : L === "en" ? "Landscape (A4 horizontal)" : "Paysage (A4 horizontal)")
                : (L === "ar" ? "عمودي (A4 رأسي)" : L === "en" ? "Portrait (A4 vertical)" : "Portrait (A4 vertical)")}
            </p>
            <p className="text-xs text-gray-400">{isLandscape ? "297mm × 210mm" : "210mm × 297mm"}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            {L === "ar" ? "نوع الشهادة" : L === "en" ? "Certificate type" : "Type de certificat"}
          </label>
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(TEMPLATE_META) as (keyof Templates)[]).map(key => (
              <button key={key} onClick={() => setActiveKey(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition ${activeKey === key ? "border-transparent text-white" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 bg-white dark:bg-gray-900"}`}
                style={activeKey === key ? { background: templates[key].primaryColor } : {}}>
                {TEMPLATE_META[key].emoji} {key === "beginner" ? (L === "ar" ? "الحفظ" : L === "en" ? "Memorization" : "Mémorisation")
                  : key === "intermediate" ? (L === "ar" ? "التفوق" : L === "en" ? "Excellence" : "Excellence")
                  : key === "advanced" ? (L === "ar" ? "الشرف" : L === "en" ? "Honor" : "Honneur")
                  : key === "expert" ? (L === "ar" ? "الإتقان" : L === "en" ? "Mastery" : "Maîtrise")
                  : key === "attendance" ? (L === "ar" ? "الحضور" : L === "en" ? "Attendance" : "Assiduité")
                  : (L === "ar" ? "المشاركة" : L === "en" ? "Participation" : "Participation")}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 space-y-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            {L === "ar" ? "ملاحظة شخصية" : L === "en" ? "Personal note" : "Note personnalisée"} <span className="font-normal text-gray-400">({L === "ar" ? "اختياري" : L === "en" ? "optional" : "optionnelle"})</span>
          </label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={200} 
            placeholder={L === "ar" ? "تهانينا..." : L === "en" ? "Congratulations..." : "Félicitations…"} 
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none transition"/>
          <p className="text-xs text-gray-400 text-right">{note.length}/200</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handlePrint} disabled={isPrinting}
            className="flex items-center gap-2 px-5 py-2.5 text-white font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-60 shadow-lg text-sm"
            style={{ background: `linear-gradient(to right, ${t.primaryColor}, ${t.accentColor})` }}>
            <Printer size={16} /> {L === "ar" ? "طباعة" : L === "en" ? "Print" : "Imprimer"}
          </button>
          <p className="text-xs text-gray-400">{printSize}</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  CERTIFICAT PROFESSIONNEL — RENDU FINAL                       */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div id="certificate-area" ref={certRef}
        style={{
          width: pageWidth,
          height: pageHeight,
          position: "relative",
          overflow: "hidden",
          boxSizing: "border-box",
          background: paperBg,
          fontFamily: `${t.fontFamily}, Georgia, serif`,
          marginTop: "16px",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
        }}>

        {/* Watermark subtil */}
        {watermarkPattern(t.primaryColor)}

        {/* Cadre de bordure SVG professionnel */}
        {borderFrameSvg(t.accentColor)}

        {/* Bordures doubles (fallback CSS) */}
        <div style={{
          position: "absolute",
          inset: "12px",
          border: `2.5px solid ${t.accentColor}40`,
          borderRadius: "2px",
          pointerEvents: "none",
          zIndex: 3,
        }} />
        <div style={{
          position: "absolute",
          inset: "20px",
          border: `0.5px solid ${t.primaryColor}15`,
          pointerEvents: "none",
          zIndex: 3,
        }} />

        {/* Coins ornementaux améliorés */}
        {cornerSvg(t.accentColor, "tl")}
        {cornerSvg(t.accentColor, "tr")}
        {cornerSvg(t.accentColor, "bl")}
        {cornerSvg(t.accentColor, "br")}

        {/* Contenu principal */}
        <div style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          height: "100%",
          padding: isLandscape ? "22px 52px" : "28px 40px",
        }}>

          {/* ═══ HEADER : Logo centré, QR à droite ═══ */}
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            width: "100%",
            marginBottom: "8px",
          }}>
            {/* ESPACEUR gauche (pour centrer le logo) */}
            <div style={{ width: "56px" }} />

            {/* ESPACE CENTRAL */}
            <div style={{ width: "100px" }} />

            {/* ESPACEUR droite (pour centrer le logo) */}
            <div style={{ width: "56px" }} />
          </div>

          {/* Ligne décorative */}
          <div style={{ width: "100%", marginBottom: "8px" }}>
            {lineSvg(t.accentColor)}
          </div>

          {/* Verset arabe */}
          <p dir="rtl" style={{
            color: t.primaryColor,
            fontFamily: `${t.fontFamilyAr}, 'Scheherazade New', serif`,
            fontSize: "0.95rem", lineHeight: 1.5, letterSpacing: isAr ? undefined : "0.04em",
            opacity: 0.75, marginBottom: "10px", textAlign: "center",
            fontWeight: 500,
          }}>
            {t.arabicVerse}
          </p>

          {/* LOGO + NOM ÉCOLE + VILLE */}
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "10px",
            justifyContent: "center",
            marginBottom: "8px",
          }}>
            {school.logo ? (
              <img src={school.logo} alt={school.name} style={{
                width: "40px", height: "40px", objectFit: "contain",
                borderRadius: "6px",
              }} />
            ) : (
              <div style={{
                width: "40px", height: "40px", borderRadius: "6px",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: `linear-gradient(135deg, ${t.primaryColor}, ${t.accentColor})`,
              }}>
                <span style={{ color: "white", fontWeight: "bold", fontSize: "16px" }}>{school.name.charAt(0)}</span>
              </div>
            )}
            <div style={{ textAlign: isAr ? "right" : "left" }}>
              <p style={{
                fontWeight: 700, fontSize: "0.85rem", color: t.textColor,
                lineHeight: 1.1, letterSpacing: isAr ? undefined : "0.04em",
                fontFamily: "'Playfair Display', Georgia, serif",
              }}>
                {school.name}
              </p>
              {school.city && (
                <p style={{ fontSize: "0.6rem", color: t.primaryColor, fontWeight: 600, letterSpacing: isAr ? undefined : "0.08em" }}>
                  {isAr ? school.city : school.city.toUpperCase()}
                </p>
              )}
            </div>
          </div>

          {/* Ligne décorative */}
          <div style={{ width: "100%", marginBottom: "8px" }}>
            {lineSvg(t.accentColor)}
          </div>

          {/* Sous-titre */}
          <p style={{
            color: t.accentColor, fontSize: "0.55rem", fontWeight: 700,
            letterSpacing: isAr ? undefined : "0.45em", textTransform: isAr ? undefined : "uppercase", marginBottom: "6px",
          }}>
            {t.subtitle}
          </p>

          {/* Titre principal */}
          <h1 style={{
            color: t.textColor, fontSize: isLandscape ? "1.8rem" : "2rem",
            fontWeight: 700, letterSpacing: isAr ? undefined : "0.12em", lineHeight: 1.05,
            marginBottom: "3px", fontFamily: "'Playfair Display', Georgia, serif",
            textTransform: isAr ? undefined : "uppercase",
            textShadow: `0 1px 2px ${t.primaryColor}10`,
          }}>
            {t.title}
          </h1>
          <p dir="rtl" style={{
            color: t.primaryColor, fontFamily: `${t.fontFamilyAr}, 'Scheherazade New', serif`,
            fontSize: "1.25rem", fontWeight: 700, lineHeight: 1.2, marginBottom: "8px",
            letterSpacing: isAr ? undefined : "0.02em",
          }}>
            {t.titleAr}
          </p>

          {/* Ligne dorée sous titre */}
          <div style={{ width: "60px", height: "3px", background: t.accentColor, opacity: 0.7, marginBottom: "10px", borderRadius: "2px" }} />


          {/* ═══ CORPS — Nom + Texte + Stats ═══ */}
          <div style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            width: "100%", maxWidth: isLandscape ? "85%" : "440px",
          }}>

            {/* "Décerné à" */}
            <p style={{
              color: "#9ca3af", fontSize: "0.52rem", textTransform: isAr ? undefined : "uppercase",
              letterSpacing: isAr ? undefined : "0.35em", marginBottom: "6px", fontWeight: 600,
            }}>
              {cl.awardedTo}
            </p>

            {/* Nom calligraphie */}
            <h2 style={{
              color: t.textColor, fontSize: isLandscape ? "1.6rem" : "1.8rem",
              fontWeight: 400, lineHeight: 1.15,
              fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif",
              fontStyle: "italic", letterSpacing: isAr ? undefined : "0.04em",
              textShadow: `0 1px 3px ${t.primaryColor}08`,
            }}>
              {student.fullName}
            </h2>
            {student.fullNameAr && (
              <p dir="rtl" style={{
                color: t.primaryColor, fontFamily: `${t.fontFamilyAr}, serif`,
                fontSize: "1rem", marginTop: "4px", opacity: 0.85, fontWeight: 500,
              }}>
                {student.fullNameAr}
              </p>
            )}

            {/* Ligne sous nom */}
            <div style={{
              width: "55%", maxWidth: "220px", height: "2px",
              background: `linear-gradient(to right, transparent, ${t.accentColor}, transparent)`,
              margin: "8px 0 10px", borderRadius: "1px",
            }} />

            {/* Texte corps */}
            <p style={{
              color: t.textColor, fontSize: "0.78rem", lineHeight: 1.55,
              fontStyle: "italic", fontFamily: "'Cormorant Garamond', Georgia, serif",
              textAlign: "center", marginBottom: "10px", opacity: 0.88,
              maxWidth: "90%",
            }}>
              « {t.bodyText} »
            </p>

            {/* Stats adaptées avec style premium */}
            <div style={{
              display: "flex", justifyContent: "center", gap: "20px",
              flexWrap: "wrap", marginBottom: "10px",
            }}>
              {(stats as any[]).map((stat, i) => (
                <div key={i} style={{ 
                  textAlign: "center",
                  padding: "6px 14px",
                  borderRadius: "10px",
                  background: `linear-gradient(135deg, ${stat.color}08, ${stat.color}03)`,
                  border: `1px solid ${stat.color}15`,
                }}>
                  <p style={{
                    color: stat.color, fontSize: stat.big ? "1.4rem" : "0.92rem",
                    fontWeight: 700, lineHeight: 1,
                  }}>
                    {stat.value}
                  </p>
                  <p style={{
                    color: "#9ca3af", fontSize: "0.48rem",
                    textTransform: isAr ? undefined : "uppercase", letterSpacing: isAr ? undefined : "0.12em", marginTop: "3px",
                    fontWeight: 600,
                  }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {student.groupName && (
              <div style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                gap: "8px", marginBottom: "8px", padding: "5px 16px",
                borderRadius: "9999px", border: `1.5px solid ${t.accentColor}25`,
                background: `linear-gradient(135deg, ${t.primaryColor}06, ${t.accentColor}06)`,
              }}>
                <span style={{ color: t.textColor, fontSize: "0.65rem", fontWeight: 600, letterSpacing: isAr ? undefined : "0.05em" }}>
                  {cl.group} : {student.groupName}
                </span>
              </div>
            )}

            {note && (
              <div style={{
                width: "100%", padding: "8px 16px", borderRadius: "8px",
                border: `1.5px solid ${t.accentColor}12`, background: "rgba(255,255,255,0.55)",
                marginBottom: "8px",
              }}>
                <p style={{
                  textAlign: "center", fontSize: "0.75rem", fontStyle: "italic",
                  color: t.textColor + "cc", lineHeight: 1.35,
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                }}>
                  « {note} »
                </p>
              </div>
            )}
          </div>

          {/* ═══ PIED DE PAGE : QR à gauche + Signatures + Sceau à droite ═══ */}
          <div style={{ width: "100%", marginTop: "auto", zIndex: 10 }}>
            <div style={{
              width: "100%", marginBottom: "8px",
              maxWidth: isLandscape ? "85%" : "440px",
              marginLeft: "auto", marginRight: "auto",
            }}>
              <div style={{
                height: "1.5px",
                background: `linear-gradient(to right, transparent, ${t.accentColor}25, transparent)`,
                borderRadius: "1px",
              }} />
            </div>

            <div style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: "16px",
              padding: "0 14px",
            }}>
              {/* QR CODE À GAUCHE (même niveau que TAHFIDZ AWARD) */}
              <div style={{ width: "100px", textAlign: "center" }}>
                {qrDataUrl ? (
                  <div style={{
                    padding: "6px",
                  }}>
                    <img src={qrDataUrl} alt="QR" style={{ width: "72px", height: "72px", display: "block" }} />
                    <p style={{
                      fontSize: "6px", marginTop: "2px", textAlign: "center",
                      letterSpacing: isAr ? undefined : "0.1em", textTransform: isAr ? undefined : "uppercase",
                      color: t.primaryColor + "50", fontWeight: 600,
                    }}>
                      {cl.verify}
                    </p>
                  </div>
                ) : (
                  <div style={{
                    width: "84px", height: "84px",
                    border: `1.5px dashed ${t.accentColor}15`,
                    borderRadius: "6px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: "8px", color: t.primaryColor + "30" }}>QR</span>
                  </div>
                )}
              </div>

              {/* SIGNATURES AU CENTRE */}
              <div style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                gap: isLandscape ? "60px" : "32px",
                flex: 1,
              }}>
                {/* Directeur */}
                <div style={{ textAlign: "center", width: "130px" }}>
                  <div style={{
                    width: "100%", height: "2px",
                    background: t.accentColor, opacity: 0.45, marginBottom: "6px", borderRadius: "1px",
                  }} />
                  <p style={{ color: "#9ca3af", fontSize: "0.5rem", textTransform: isAr ? undefined : "uppercase", letterSpacing: isAr ? undefined : "0.2em", marginBottom: "3px", fontWeight: 600 }}>
                    {cl.director}
                  </p>
                  <p style={{ color: t.textColor, fontSize: "0.75rem", fontWeight: 600, lineHeight: 1.25 }}>
                    {t.directorName}
                  </p>
                  {t.directorNameAr && (
                    <p dir="rtl" style={{ color: t.primaryColor, fontFamily: `${t.fontFamilyAr}, serif`, fontSize: "0.62rem", marginTop: "2px", fontWeight: 500 }}>
                      {t.directorNameAr}
                    </p>
                  )}
                </div>

                {/* Enseignant */}
                <div style={{ textAlign: "center", width: "130px" }}>
                  <div style={{
                    width: "100%", height: "2px",
                    background: t.accentColor, opacity: 0.45, marginBottom: "6px", borderRadius: "1px",
                  }} />
                  <p style={{ color: "#9ca3af", fontSize: "0.5rem", textTransform: isAr ? undefined : "uppercase", letterSpacing: isAr ? undefined : "0.2em", marginBottom: "3px", fontWeight: 600 }}>
                    {cl.teacher}
                  </p>
                  <p style={{ color: t.textColor, fontSize: "0.75rem", fontWeight: 600, lineHeight: 1.25 }}>
                    {t.teacherName || student.teacherName || "—"}
                  </p>
                  {t.teacherNameAr && (
                    <p dir="rtl" style={{ color: t.primaryColor, fontFamily: `${t.fontFamilyAr}, serif`, fontSize: "0.62rem", marginTop: "2px", fontWeight: 500 }}>
                      {t.teacherNameAr}
                    </p>
                  )}
                </div>

                {/* Date */}
                <div style={{ textAlign: "center", width: "130px" }}>
                  <div style={{
                    width: "100%", height: "2px",
                    background: t.accentColor, opacity: 0.45, marginBottom: "6px", borderRadius: "1px",
                  }} />
                  <p style={{ color: "#9ca3af", fontSize: "0.5rem", textTransform: isAr ? undefined : "uppercase", letterSpacing: isAr ? undefined : "0.2em", marginBottom: "3px", fontWeight: 600 }}>
                    {cl.date}
                  </p>
                  <p style={{ color: t.textColor, fontSize: "0.75rem", fontWeight: 600, lineHeight: 1.25 }}>
                    {today}
                  </p>
                  <p style={{ color: "#9ca3af", fontSize: "0.55rem", marginTop: "3px", fontFamily: `${t.fontFamilyAr}, serif` }}>{todayAr}</p>
                </div>
              </div>

              {/* SCEAU TAHFIDZ AWARD À DROITE */}
              <div style={{ opacity: 0.85, marginBottom: "4px" }}>
                {sealSvg(t.primaryColor, t.accentColor)}
              </div>
            </div>

            {/* Footer école premium */}
            <div style={{
              marginTop: "10px",
              display: "flex", alignItems: "center", gap: "10px",
              maxWidth: "460px", margin: "10px auto 0",
            }}>
              <div style={{ flex: 1, height: "1.5px", background: `linear-gradient(to right, transparent, ${t.primaryColor})`, borderRadius: "1px" }} />
              <span style={{
                color: t.accentColor + "50", fontSize: "0.46rem",
                letterSpacing: isAr ? undefined : "0.25em", textTransform: isAr ? undefined : "uppercase", whiteSpace: "nowrap", fontWeight: 600,
              }}>
                {school.name}{school.city ? ` — ${school.city}` : ""} — {cl.footer}
              </span>
              <div style={{ flex: 1, height: "1.5px", background: `linear-gradient(to left, transparent, ${t.primaryColor})`, borderRadius: "1px" }} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}


// ═══════════════════════════════════════════════════════════════════════════
// CERTIFICATE TEMPLATE EDITOR — VERSION PROFESSIONNELLE
// ═══════════════════════════════════════════════════════════════════════════

const EDITOR_UI: Record<string, { fr: string; en: string; ar: string }> = {
  resetBtn:        { fr: "Réinitialiser",              en: "Reset",                   ar: "إعادة تعيين" },
  saveBtn:         { fr: "Enregistrer",                en: "Save",                    ar: "حفظ" },
  savedMsg:        { fr: "Templates sauvegardés !",    en: "Templates saved!",        ar: "تم حفظ القوالب!" },
  sectionTitles:   { fr: "Titres",                     en: "Titles",                  ar: "العناوين" },
  titleMain:       { fr: "Titre principal (français)", en: "Main title (French)",     ar: "العنوان الرئيسي (فرنسي)" },
  titleAr:         { fr: "Titre en arabe",             en: "Arabic title",            ar: "العنوان بالعربية" },
  subtitle:        { fr: "Sous-titre",                 en: "Subtitle",                ar: "العنوان الفرعي" },
  sectionText:     { fr: "Texte & Calligraphie",       en: "Text & Calligraphy",      ar: "النص والخط" },
  bodyText:        { fr: "Texte du corps",             en: "Body text",               ar: "نص الجسم" },
  arabicVerse:     { fr: "Verset / texte arabe",       en: "Verse / Arabic text",     ar: "الآية / النص العربي" },
  badgeEmoji:      { fr: "Emoji badge",                en: "Badge emoji",             ar: "رمز الشارة" },
  sectionColors:   { fr: "Couleurs & Style",           en: "Colors & Style",          ar: "الألوان والنمط" },
  colorPrimary:    { fr: "Principale",                 en: "Primary",                 ar: "الرئيسية" },
  colorAccent:     { fr: "Dorée / Accent",             en: "Gold / Accent",           ar: "الذهبية / المميزة" },
  colorLight:      { fr: "Fond clair",                 en: "Light background",        ar: "الخلفية الفاتحة" },
  colorText:       { fr: "Texte sombre",               en: "Dark text",               ar: "النص الداكن" },
  stylePreset:     { fr: "Style prédéfini",            en: "Preset style",            ar: "النمط الجاهز" },
  preview:         { fr: "Prévisualisation",           en: "Preview",                 ar: "معاينة" },
  previewNote:     { fr: "Aperçu temps réel — le certificat final est plus grand", en: "Live preview — the final certificate is larger", ar: "معاينة فورية — الشهادة النهائية أكبر" },
  awardedTo:       { fr: "Ce certificat est décerné à", en: "This certificate is awarded to", ar: "تُمنح هذه الشهادة لـ" },
  direction:       { fr: "Direction",                  en: "Direction",               ar: "الإدارة" },
  teacher:         { fr: "Enseignant",                 en: "Teacher",                 ar: "المعلم" },
  fontFamily:      { fr: "Police française",           en: "French font",             ar: "خط فرنسي" },
  fontFamilyAr:    { fr: "Police arabe",               en: "Arabic font",             ar: "خط عربي" },
  orientation:     { fr: "Orientation",                en: "Orientation",             ar: "الاتجاه" },
  portrait:        { fr: "Portrait (A4 vertical)",     en: "Portrait (A4 vertical)",  ar: "عمودي (A4)" },
  landscape:       { fr: "Paysage (A4 horizontal)",    en: "Landscape (A4 horizontal)", ar: "أفقي (A4)" },
  directorSection: { fr: "Signatures",                 en: "Signatures",              ar: "التوقيعات" },
  directorName:    { fr: "Nom du directeur",           en: "Director name",           ar: "اسم المدير" },
  directorNameAr:  { fr: "Nom du directeur (arabe)",   en: "Director name (Arabic)",  ar: "اسم المدير (عربي)" },
  showTeacher:     { fr: "Afficher l'enseignant",      en: "Show teacher",            ar: "إظهار المعلم" },
  teacherName:     { fr: "Nom de l'enseignant",        en: "Teacher name",            ar: "اسم المعلم" },
  teacherNameAr:   { fr: "Nom de l'enseignant (arabe)", en: "Teacher name (Arabic)", ar: "اسم المعلم (عربي)" },
  teacherAuto:     { fr: "(Auto : récupéré depuis le profil élève)", en: "(Auto: from student profile)", ar: "(تلقائي: من ملف الطالب)" },
}

type Locale = "fr" | "en" | "ar"

interface EditorProps {
  initialTemplates: Partial<Templates>
  locale?: Locale
}

export function CertificateTemplateEditor({ initialTemplates, locale }: EditorProps) {
  const { locale: ctxLocale } = useLanguage()
  const L: Locale = locale ?? (ctxLocale as Locale) ?? "fr"
  const u = (k: keyof typeof EDITOR_UI) => EDITOR_UI[k][L] ?? EDITOR_UI[k].fr

  const [templates, setTemplates] = useState<Templates>({
    beginner:      { ...DEFAULTS.beginner,      ...(initialTemplates.beginner      ?? {}) },
    intermediate:  { ...DEFAULTS.intermediate,  ...(initialTemplates.intermediate  ?? {}) },
    advanced:      { ...DEFAULTS.advanced,      ...(initialTemplates.advanced      ?? {}) },
    expert:        { ...DEFAULTS.expert,        ...(initialTemplates.expert        ?? {}) },
    attendance:    { ...DEFAULTS.attendance,    ...(initialTemplates.attendance    ?? {}) },
    participation: { ...DEFAULTS.participation, ...(initialTemplates.participation ?? {}) },
  })
  const [activeLevel, setActiveLevel] = useState<keyof Templates>("beginner")
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  const t = templates[activeLevel]

  const update = (key: keyof CertTemplate, value: any) => {
    setTemplates(prev => ({ ...prev, [activeLevel]: { ...prev[activeLevel], [key]: value } }))
    setSaved(false)
  }

  const applyPreset = (styleKey: string) => {
    const preset = STYLE_PRESETS[styleKey]
    if (!preset) return
    setTemplates(prev => ({
      ...prev,
      [activeLevel]: { ...prev[activeLevel], primaryColor: preset.colors[0], accentColor: preset.colors[1], lightColor: preset.colors[2], textColor: preset.colors[3], decorativePattern: preset.pattern, fontFamily: preset.font, fontFamilyAr: preset.fontAr, borderStyle: styleKey },
    }))
    setSaved(false)
  }

  const save = async () => {
    setSaving(true); setError(null)
    try {
      const r = await fetch("/api/admin/certificate-templates", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(templates) })
      if (!r.ok) { const d = await r.json(); throw new Error(d.error) }
      setSaved(true); setTimeout(() => setSaved(false), 3000)
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur") }
    finally { setSaving(false) }
  }

  const reset = () => {
    setTemplates(prev => ({ ...prev, [activeLevel]: { ...DEFAULTS[activeLevel] } }))
    setSaved(false)
  }

  const renderPattern = () => {
    const patterns: Record<string, JSX.Element> = {
      geometric: (
        <svg width="100%" height="60" viewBox="0 0 400 60" preserveAspectRatio="none">
          <defs><pattern id="geo" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <polygon points="20,0 40,20 20,40 0,20" fill="none" stroke={t.accentColor} strokeWidth="0.5" opacity="0.3"/>
            <circle cx="20" cy="20" r="5" fill={t.accentColor} opacity="0.2"/>
          </pattern></defs>
          <rect width="100%" height="60" fill="url(#geo)"/>
        </svg>
      ),
      floral: (
        <svg width="100%" height="60" viewBox="0 0 400 60" preserveAspectRatio="none">
          <defs><pattern id="floral" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M30 15 Q40 5 50 15 Q40 25 30 15 M30 15 Q20 5 10 15 Q20 25 30 15" fill="none" stroke={t.accentColor} strokeWidth="0.8" opacity="0.25"/>
            <circle cx="30" cy="30" r="3" fill={t.primaryColor} opacity="0.15"/>
          </pattern></defs>
          <rect width="100%" height="60" fill="url(#floral)"/>
        </svg>
      ),
      ornate: (
        <svg width="100%" height="60" viewBox="0 0 400 60" preserveAspectRatio="none">
          <path d="M0 30 Q50 10 100 30 T200 30 T300 30 T400 30" fill="none" stroke={t.accentColor} strokeWidth="1.5" opacity="0.4"/>
          <path d="M0 30 Q50 50 100 30 T200 30 T300 30 T400 30" fill="none" stroke={t.primaryColor} strokeWidth="1" opacity="0.3"/>
        </svg>
      ),
      architectural: (
        <svg width="100%" height="60" viewBox="0 0 400 60" preserveAspectRatio="none">
          <defs><pattern id="arch" x="0" y="0" width="80" height="60" patternUnits="userSpaceOnUse">
            <path d="M10 60 L10 30 Q25 10 40 30 Q55 10 70 30 L70 60" fill="none" stroke={t.accentColor} strokeWidth="1" opacity="0.3"/>
            <rect x="35" y="20" width="10" height="15" fill={t.primaryColor} opacity="0.15"/>
          </pattern></defs>
          <rect width="100%" height="60" fill="url(#arch)"/>
        </svg>
      ),
    }
    return patterns[t.decorativePattern] || patterns.geometric
  }

  const isLandscape   = t.orientation === "landscape"
  const previewMaxW   = isLandscape ? "600px" : "400px"
  const previewTeacherName   = t.teacherName   || "M. Martin"
  const previewTeacherNameAr = t.teacherNameAr || "الأستاذ"

  const inputCls = "w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/settings" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
          <ArrowLeft size={18} className="text-gray-500" />
        </Link>
        <div className="flex gap-2 ml-auto">
          <button onClick={reset} className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-300">
            <RotateCcw size={14} /> {u("resetBtn")}
          </button>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-60 transition shadow-md">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {u("saveBtn")}
          </button>
        </div>
      </div>

      {saved && <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-300 text-sm"><CheckCircle2 size={15}/>{u("savedMsg")}</div>}
      {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">{error}</div>}

      {/* Onglets niveau */}
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(TEMPLATE_META) as (keyof Templates)[]).map(lvl => (
          <button key={lvl} onClick={() => setActiveLevel(lvl)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition border-2 ${activeLevel === lvl ? "border-transparent text-white shadow-md" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 bg-white dark:bg-gray-900"}`}
            style={activeLevel === lvl ? { background: templates[lvl].primaryColor } : {}}>
            {TEMPLATE_META[lvl].label[L] ?? TEMPLATE_META[lvl].label.fr}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ─── Formulaire édition ─── */}
        <div className="space-y-4">
          {/* Préréglages */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wide flex items-center gap-2"><Sparkles size={16} className="text-amber-500"/> {u("stylePreset")}</h2>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(STYLE_PRESETS).map(([key, preset]) => (
                <button key={key} onClick={() => applyPreset(key)}
                  className={`p-3 rounded-lg border-2 transition text-left ${t.borderStyle === key ? "border-emerald-500 ring-2 ring-emerald-200" : "border-gray-200 dark:border-gray-700 hover:border-gray-300"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 rounded-full" style={{ background: preset.colors[0] }}/>
                    <div className="w-4 h-4 rounded-full" style={{ background: preset.colors[1] }}/>
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{preset.name}</p>
                  <p className="text-xs text-gray-400">{preset.font} + {preset.fontAr}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Orientation */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wide flex items-center gap-2"><LayoutTemplate size={16}/> {u("orientation")}</h2>
            <div className="flex gap-3">
              {["portrait", "landscape"].map(ori => (
                <button key={ori} onClick={() => update("orientation", ori as "portrait" | "landscape")}
                  className={`flex-1 p-4 rounded-xl border-2 transition text-center ${t.orientation === ori ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-gray-200 dark:border-gray-700 hover:border-gray-300"}`}>
                  <div className={`${ori === "portrait" ? "w-8 h-12" : "w-12 h-8"} border-2 border-current rounded mx-auto mb-2`} style={{ color: t.primaryColor }}/>
                  <p className="text-sm font-medium">{u(ori as keyof typeof EDITOR_UI)}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Signatures */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wide flex items-center gap-2"><UserCheck size={16}/> {u("directorSection")}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{u("directorName")}</label>
                <input value={t.directorName} onChange={e => update("directorName", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{u("directorNameAr")}</label>
                <input value={t.directorNameAr} onChange={e => update("directorNameAr", e.target.value)} dir="rtl" className={inputCls} />
              </div>
            </div>
            <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input type="checkbox" checked={t.showTeacher} onChange={e => update("showTeacher", e.target.checked)} className="w-4 h-4 rounded accent-emerald-600"/>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{u("showTeacher")}</span>
              </label>
              {t.showTeacher && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-400 italic">{u("teacherAuto")}</p>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{u("teacherName")} <span className="text-gray-400 font-normal">(optionnel)</span></label>
                    <input value={t.teacherName} onChange={e => update("teacherName", e.target.value)} placeholder="Laisser vide pour utiliser l'enseignant de l'élève" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{u("teacherNameAr")} <span className="text-gray-400 font-normal">(optionnel)</span></label>
                    <input value={t.teacherNameAr} onChange={e => update("teacherNameAr", e.target.value)} dir="rtl" placeholder="الأستاذ" className={inputCls} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Titres */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wide flex items-center gap-2"><Type size={16}/> {u("sectionTitles")}</h2>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{u("titleMain")}</label>
              <input value={t.title} onChange={e => update("title", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{u("titleAr")}</label>
              <input value={t.titleAr} onChange={e => update("titleAr", e.target.value)} dir="rtl" className={inputCls} style={{ fontFamily: t.fontFamilyAr + ", serif" }} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{u("subtitle")}</label>
              <input value={t.subtitle} onChange={e => update("subtitle", e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Texte */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wide flex items-center gap-2"><BookOpen size={16}/> {u("sectionText")}</h2>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{u("bodyText")}</label>
              <textarea value={t.bodyText} onChange={e => update("bodyText", e.target.value)} rows={4} className={`${inputCls} resize-none`} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{u("arabicVerse")}</label>
              <input value={t.arabicVerse} onChange={e => update("arabicVerse", e.target.value)} dir="rtl" className={inputCls} style={{ fontFamily: t.fontFamilyAr + ", serif" }} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{u("badgeEmoji")}</label>
              <input value={t.badgeEmoji} onChange={e => update("badgeEmoji", e.target.value)} maxLength={4} className="w-24 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-xl text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" />
            </div>
          </div>

          {/* Couleurs */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wide flex items-center gap-2"><Palette size={16}/> {u("sectionColors")}</h2>
            <div className="grid grid-cols-2 gap-4">
              {([
                { key: "primaryColor", labelKey: "colorPrimary" },
                { key: "accentColor",  labelKey: "colorAccent" },
                { key: "lightColor",   labelKey: "colorLight" },
                { key: "textColor",    labelKey: "colorText" },
              ] as { key: keyof CertTemplate; labelKey: keyof typeof EDITOR_UI }[]).map(({ key, labelKey }) => (
                <div key={key} className="flex items-center gap-3">
                  <input type="color" value={t[key] as string} onChange={e => update(key, e.target.value)} className="w-10 h-10 rounded-lg border-0 cursor-pointer p-0.5 shadow-sm" />
                  <div>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{u(labelKey)}</p>
                    <p className="text-xs text-gray-400 font-mono">{t[key] as string}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{u("fontFamily")}</label>
              <select value={t.fontFamily} onChange={e => update("fontFamily", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm mb-2">
                <option value="Georgia">Georgia (Classique)</option>
                <option value="Amiri">Amiri (Islamique)</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="serif">Serif (Générique)</option>
              </select>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{u("fontFamilyAr")}</label>
              <select value={t.fontFamilyAr} onChange={e => update("fontFamilyAr", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm">
                <option value="Scheherazade New">Scheherazade New (Coranique)</option>
                <option value="Amiri">Amiri (Classique)</option>
                <option value="Reem Kufi">Reem Kufi (Kufi Moderne)</option>
                <option value="Noto Naskh Arabic">Noto Naskh (Lisible)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ─── Prévisualisation ─── */}
        <div className="sticky top-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Eye size={14}/> {u("preview")}
          </p>
          <p className="text-xs text-gray-400 mb-3">{u("previewNote")}</p>

          <div className="rounded-2xl overflow-hidden shadow-2xl border-2" style={{ borderColor: t.accentColor + "60", background: t.lightColor, maxWidth: previewMaxW, margin: "0 auto", aspectRatio: isLandscape ? "297/210" : "210/297" }}>
            <div className="relative">
              {renderPattern()}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/80"/>
            </div>
            <div className="p-6" style={{ fontFamily: t.fontFamily + ", serif" }}>
              <p className="text-center mb-2 text-sm" dir="rtl" style={{ color: t.primaryColor, fontFamily: t.fontFamilyAr + ", serif" }}>{t.arabicVerse}</p>
              <div className="text-center mb-3">
                <p className={`text-[10px] font-bold mb-0.5 ${L === "ar" ? "" : "tracking-[0.2em] uppercase"}`} style={{ color: t.accentColor }}>{t.subtitle}</p>
                <h2 className="text-lg font-bold" style={{ color: t.textColor }}>{t.title}</h2>
                <p className="text-base mt-0.5" dir="rtl" style={{ color: t.primaryColor, fontFamily: t.fontFamilyAr + ", serif" }}>{t.titleAr}</p>
              </div>
              <div className="bg-white/60 rounded-lg p-2 mb-3 border" style={{ borderColor: t.accentColor + "30" }}>
                <p className="text-xs text-center" style={{ color: t.textColor + "cc" }}>{t.bodyText}</p>
              </div>
              <div className="flex items-center gap-3 mb-3 p-2 bg-white/80 rounded-lg border" style={{ borderColor: t.primaryColor + "20" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: `linear-gradient(135deg, ${t.primaryColor}, ${t.accentColor})` }}>A</div>
                <div>
                  <p className={`text-[10px] text-gray-400 ${L === "ar" ? "" : "uppercase"}`}>{u("awardedTo")}</p>
                  <p className="text-sm font-bold" style={{ color: t.textColor }}>Ahmed Benali</p>
                </div>
              </div>
              <div className="flex justify-between items-end pt-2 border-t" style={{ borderColor: t.accentColor + "30" }}>
                <div className="text-center" style={{ width: "80px" }}>
                  <div className="w-full h-px mb-1" style={{ background: t.primaryColor + "50" }}/>
                  <p className="text-[10px] text-gray-400">{u("direction")}</p>
                  <p className="text-[10px] font-medium" style={{ color: t.textColor }}>{t.directorName}</p>
                </div>
                {t.showTeacher && (
                  <div className="text-center" style={{ width: "80px" }}>
                    <div className="w-full h-px mb-1" style={{ background: t.primaryColor + "50" }}/>
                    <p className="text-[10px] text-gray-400">{u("teacher")}</p>
                    <p className="text-[10px] font-medium" style={{ color: t.textColor }}>{previewTeacherName}</p>
                    {previewTeacherNameAr && <p className="text-[9px]" dir="rtl" style={{ color: t.primaryColor, fontFamily: t.fontFamilyAr + ", serif" }}>{previewTeacherNameAr}</p>}
                  </div>
                )}
                <div className="text-center" style={{ width: "80px" }}>
                  <div className="w-full h-px mb-1" style={{ background: t.primaryColor + "50" }}/>
                  <p className="text-[10px] text-gray-400">Date</p>
                  <p className="text-[10px] font-medium" style={{ color: t.textColor }}>19/05/2026</p>
                </div>
              </div>
            </div>
            <div className="relative rotate-180">
              {renderPattern()}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/80"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}