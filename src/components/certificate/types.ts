export type CertConfig = {
  title: string
  titleAr?: string
  subtitle?: string
  bodyText?: string
  arabicVerse?: string
  primaryColor: string
  accentColor: string
  lightColor: string
  textColor: string
  fontFamily?: string
  fontFamilyAr?: string
  orientation?: "portrait" | "landscape"
  directorName?: string
  directorNameAr?: string
  showTeacher?: boolean
  teacherName?: string
  teacherNameAr?: string
  showStats?: boolean
  showQr?: boolean
}

export type CertificateTemplate = {
  id: string
  schoolId: string
  name: string
  nameAr?: string | null
  config: CertConfig
  isDefault: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export type StudentCertData = {
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
  memorizedSurahs: { id: number; nameFr: string; nameAr?: string }[]
  studentCode?: string
  avgScore?: number
  tajwidScore?: number
  attendanceRate?: number
}

export type SchoolCertData = {
  name: string
  nameAr?: string
  logo?: string
  city?: string
  slug?: string
  directorSignature?: string | null
  teacherSignature?: string | null
}

export const DEFAULT_CERT_CONFIG: CertConfig = {
  title: "Certificat de Mémorisation",
  titleAr: "شَهَادَةُ الْحِفْظ",
  subtitle: "Niveau Débutant",
  bodyText:
    "Pour avoir accompli avec sérieux et persévérance son programme de mémorisation du Saint Coran.",
  arabicVerse: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
  primaryColor: "#1a5f4a",
  accentColor: "#c9a227",
  lightColor: "#f0f7f4",
  textColor: "#0d3326",
  fontFamily: "Georgia",
  fontFamilyAr: "Amiri",
  orientation: "portrait",
  directorName: "Directeur",
  directorNameAr: "المدير",
  showTeacher: true,
  showStats: true,
  showQr: true,
}
