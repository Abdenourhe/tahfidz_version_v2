"use client"

// ─── Types ───────────────────────────────────────────────────────
export interface SchoolUser {
  id: string
  fullName: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
}

export interface School {
  id: string
  name: string
  nameAr: string | null
  slug: string
  plan: string
  isActive: boolean
  createdAt: string
  logo: string | null
  address: string | null
  city: string | null
  country: string | null
  phone: string | null
  _count: { users: number }
  users: SchoolUser[]
}

export interface SchoolRequest {
  id: string
  schoolName: string
  city: string | null
  country: string
  adminName: string
  adminEmail: string
  adminPhone: string | null
  classCount: number
  studentsPerClass: number
  teachersCount: number
  status: "PENDING" | "APPROVED" | "REJECTED"
  slug: string | null
  createdAt: string
  processedAt: string | null
}

export interface ApprovalResult {
  schoolName: string
  slug: string
  plan: string
  adminEmail: string
  adminName: string
}

export interface AuditLog {
  id: string
  action: string
  actor: string | null
  actorId: string | null
  target: string | null
  targetId: string | null
  targetType: string | null
  details: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

export interface FeedbackItem {
  id: string
  type: string
  category: string
  title: string
  message: string
  screenshot: string | null
  status: string
  priority: string
  adminNote: string | null
  createdAt: string
  resolvedAt: string | null
  user: { fullName: string; email: string; role: string; phone: string | null }
  school: { name: string; slug: string }
}

export interface SystemHealth {
  status: "healthy" | "warning" | "critical"
  apiLatency: number
  dbStatus: string
  lastError: string | null
  errorCount24h: number
}

export type TimeRange = "7d" | "30d" | "90d" | "1y"
export type TabKey = "schools" | "requests" | "health" | "audit" | "broadcast" | "feedback"

// ─── Constantes ───────────────────────────────────────────────────
export const EMPTY_FORM = {
  schoolName: "",
  schoolSlug: "",
  plan: "FREE",
  address: "",
  city: "",
  country: "DZ",
  phone: "",
  adminEmail: "",
  adminName: "",
  adminPassword: "",
}

export const PLAN_PRICES: Record<string, number> = {
  FREE: 0,
  STARTER: 29,
  PRO: 79,
  ENTERPRISE: 199,
}

export const COUNTRIES = [
  { code: "DZ", name: "Algérie" },
  { code: "MA", name: "Maroc" },
  { code: "TN", name: "Tunisie" },
  { code: "LY", name: "Libye" },
  { code: "EG", name: "Égypte" },
  { code: "SA", name: "Arabie Saoudite" },
  { code: "AE", name: "Émirats Arabes Unis" },
  { code: "QA", name: "Qatar" },
  { code: "KW", name: "Koweït" },
  { code: "BH", name: "Bahreïn" },
  { code: "OM", name: "Oman" },
  { code: "JO", name: "Jordanie" },
  { code: "LB", name: "Liban" },
  { code: "SY", name: "Syrie" },
  { code: "IQ", name: "Irak" },
  { code: "SD", name: "Soudan" },
  { code: "MR", name: "Mauritanie" },
  { code: "SO", name: "Somalie" },
  { code: "DJ", name: "Djibouti" },
  { code: "KM", name: "Comores" },
  { code: "FR", name: "France" },
  { code: "BE", name: "Belgique" },
  { code: "DE", name: "Allemagne" },
  { code: "GB", name: "Royaume-Uni" },
  { code: "CA", name: "Canada" },
  { code: "US", name: "États-Unis" },
  { code: "TR", name: "Turquie" },
  { code: "SN", name: "Sénégal" },
  { code: "ML", name: "Mali" },
  { code: "NE", name: "Niger" },
  { code: "NG", name: "Nigéria" },
  { code: "OTHER", name: "Autre" },
]

// ─── Helpers ──────────────────────────────────────────────────────
export function generateSlug(): string {
  const L = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  return `${L[Math.floor(Math.random() * 26)]}${L[Math.floor(Math.random() * 26)]}-${Math.floor(10000 + Math.random() * 90000)}`
}

export function formatPhone(raw: string | null): string {
  if (!raw) return "—"
  const digits = raw.replace(/\D/g, "")
  if (digits.startsWith("213") && digits.length >= 11) {
    const local = digits.slice(3)
    return `(+213) ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`
  }
  if (digits.startsWith("0") && digits.length === 10) {
    return `(+213) ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
  }
  return raw
}

export function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function getActionColor(action: string): string {
  if (action.includes("DELETE")) return "bg-red-500"
  if (action.includes("CREATE") || action.includes("APPROVE")) return "bg-emerald-500"
  if (action.includes("UPDATE") || action.includes("EDIT")) return "bg-blue-500"
  if (action.includes("REJECT") || action.includes("BAN")) return "bg-orange-500"
  if (action.includes("LOGIN") || action.includes("IMPERSONATE")) return "bg-purple-500"
  return "bg-gray-400"
}

export function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    CREATE_SCHOOL: "Création école",
    UPDATE_SCHOOL: "Modification école",
    DELETE_SCHOOL: "Suppression école",
    TOGGLE_SCHOOL: "Activation/Désactivation",
    APPROVE_REQUEST: "Approbation demande",
    REJECT_REQUEST: "Rejet demande",
    DELETE_REQUEST: "Suppression demande",
    CREATE_USER: "Création utilisateur",
    UPDATE_USER: "Modification utilisateur",
    DELETE_USER: "Suppression utilisateur",
    IMPERSONATE: "Impersonation",
    BROADCAST: "Broadcast",
    EXPORT_DATA: "Export données",
    CLEAR_HISTORY: "Nettoyage historique",
  }
  return labels[action] || action.replace(/_/g, " ")
}

export function getTargetIcon(targetType: string | null): string {
  if (!targetType) return "🔧"
  const icons: Record<string, string> = { SCHOOL: "🏫", REQUEST: "📋", USER: "👤", SYSTEM: "⚙️" }
  return icons[targetType] || "🔧"
}

export function getFeedbackTypeColor(type: string): string {
  const map: Record<string, string> = {
    BUG: "bg-red-100 text-red-700",
    SUGGESTION: "bg-amber-100 text-amber-700",
    FEEDBACK: "bg-blue-100 text-blue-700",
    OTHER: "bg-gray-100 text-gray-600",
  }
  return map[type] || map.OTHER
}

export function getFeedbackTypeLabel(type: string): string {
  const map: Record<string, string> = { BUG: "Bug", SUGGESTION: "Suggestion", FEEDBACK: "Commentaire", OTHER: "Autre" }
  return map[type] || type
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING: "bg-orange-100 text-orange-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    RESOLVED: "bg-green-100 text-green-700",
    CLOSED: "bg-gray-100 text-gray-500",
  }
  return map[status] || map.PENDING
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = { PENDING: "En attente", IN_PROGRESS: "En cours", RESOLVED: "Résolu", CLOSED: "Fermé" }
  return map[status] || status
}

export function getPriorityColor(priority: string): string {
  const map: Record<string, string> = {
    LOW: "bg-gray-100 text-gray-600",
    MEDIUM: "bg-yellow-100 text-yellow-700",
    HIGH: "bg-orange-100 text-orange-700",
    CRITICAL: "bg-red-100 text-red-700",
  }
  return map[priority] || map.LOW
}

export function getPriorityLabel(priority: string): string {
  const map: Record<string, string> = { LOW: "Basse", MEDIUM: "Moyenne", HIGH: "Haute", CRITICAL: "Critique" }
  return map[priority] || priority
}
