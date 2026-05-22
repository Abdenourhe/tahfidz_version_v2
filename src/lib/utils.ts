// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Raccourcit un UUID pour l'affichage : "0976ab11-72d4-…" → "#0976AB11"
 * Utiliser dans les tables admin pour remplacer les UUIDs complets.
 */
export function shortId(id: string): string {
  return "#" + id.replace(/-/g, "").slice(0, 8).toUpperCase()
}

/** Calcule le score final d'une évaluation */
export function calculateFinalScore(scores: {
  memorizationScore: number
  tajweedScore: number
  fluencyScore: number
  makharijScore?: number
}): number {
  const { memorizationScore, tajweedScore, fluencyScore, makharijScore } = scores
  if (makharijScore !== undefined) {
    return Math.round((memorizationScore * 0.4) + (tajweedScore * 0.3) + (fluencyScore * 0.2) + (makharijScore * 0.1))
  }
  return Math.round((memorizationScore * 0.45) + (tajweedScore * 0.35) + (fluencyScore * 0.2))
}

/** Retourne le dashboard selon le rôle */
export function getDashboardPath(role: string): string {
  switch (role) {
    case "SUPERADMIN": return "/superadmin/dashboard"
    case "ADMIN":      return "/admin/dashboard"
    case "TEACHER":    return "/teacher/dashboard"
    case "PARENT":     return "/parent/dashboard"
    case "STUDENT":    return "/student/dashboard"
    default:           return "/login"
  }
}

/** Formate un score en lettre */
export function scoreToGrade(score: number): { grade: string; label: string; color: string; bg: string } {
  if (score >= 90) return { grade: "A+", label: "Excellent",    color: "text-green-600",  bg: "bg-green-100" }
  if (score >= 80) return { grade: "A",  label: "Très bien",   color: "text-green-500",  bg: "bg-green-50" }
  if (score >= 70) return { grade: "B",  label: "Bien",        color: "text-blue-500",   bg: "bg-blue-50" }
  if (score >= 60) return { grade: "C",  label: "Passable",    color: "text-yellow-500", bg: "bg-yellow-50" }
  if (score >= 50) return { grade: "D",  label: "Insuffisant", color: "text-orange-500", bg: "bg-orange-50" }
  return { grade: "F", label: "Échec", color: "text-red-500", bg: "bg-red-50" }
}

/** Étoiles gagnées selon le score */
export function starsFromScore(score: number): number {
  if (score >= 95) return 5
  if (score >= 85) return 4
  if (score >= 75) return 3
  if (score >= 65) return 2
  if (score >= 50) return 1
  return 0
}

/** Génère un code élève lisible */
export function generateStudentCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = "TP-"
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

/** Formate une date en français */
export function formatDate(date: Date | string, locale?: string, options?: Intl.DateTimeFormatOptions): string {
  const localeMap: Record<string, string> = {
    fr: "fr-FR",
    en: "en-US",
    ar: "ar-SA",
  }
  return new Intl.DateTimeFormat(localeMap[locale || "fr"] || "fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    ...options,
  }).format(new Date(date))
}

/** Calcule le pourcentage d'avancement */
export function calcProgress(current: number, total: number): number {
  if (total === 0) return 0
  return Math.round((current / total) * 100)
}

/** Label français du statut de mémorisation */
export function statusLabel(status: string): { label: string; color: string; bg: string } {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    NOT_STARTED:              { label: "Non commencé",       color: "text-gray-500",   bg: "bg-gray-100" },
    IN_PROGRESS:              { label: "En cours",           color: "text-blue-600",   bg: "bg-blue-100" },
    UNDER_REVIEW:             { label: "En révision",        color: "text-yellow-600", bg: "bg-yellow-100" },
    READY_FOR_RECITATION:     { label: "Prêt à réciter",     color: "text-purple-600", bg: "bg-purple-100" },
    PENDING_TEACHER_APPROVAL: { label: "En attente prof",    color: "text-orange-600", bg: "bg-orange-100" },
    MEMORIZED:                { label: "Mémorisé ✓",         color: "text-green-700",  bg: "bg-green-100" },
    NEEDS_REVISION:           { label: "Révision requise",   color: "text-red-600",    bg: "bg-red-100" },
  }
  return map[status] ?? { label: status, color: "text-gray-500", bg: "bg-gray-100" }
}

/** Rôle en français */
export function roleLabel(role: string): string {
  const map: Record<string, string> = {
    SUPERADMIN: "Super Admin",
    ADMIN:      "Administrateur",
    TEACHER:    "Enseignant",
    PARENT:     "Parent",
    STUDENT:    "Élève",
  }
  return map[role] ?? role
}

/**
 * Calculate age in years from a birth date.
 * Returns null if date is missing or invalid.
 */
export function calculateAge(birthDate: Date | string | null | undefined): number | null {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  if (isNaN(birth.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age >= 0 && age < 150 ? age : null
}

/**
 * Format age with years and months, e.g. "12 ans 4 mois" or "—" if unknown.
 */
export function formatAge(birthDate: Date | string | null | undefined): string {
  if (!birthDate) return "—"
  const birth = new Date(birthDate)
  if (isNaN(birth.getTime())) return "—"
  const today = new Date()
  let years  = today.getFullYear() - birth.getFullYear()
  let months = today.getMonth() - birth.getMonth()
  if (today.getDate() < birth.getDate()) months--
  if (months < 0) { years--; months += 12 }
  const parts = []
  if (years > 0)  parts.push(`${years} an${years > 1 ? "s" : ""}`)
  if (months > 0) parts.push(`${months} mois`)
  return parts.length ? parts.join(" ") : "< 1 mois"
}
