// src/lib/halaqa-quota.ts
// Gestion des quotas Halaqa par école / abonnement

import { prisma } from "@/lib/prisma"
import { BillingCycle, SchoolPlan } from "@prisma/client"

export interface HalaqaPlanConfig {
  monthlyHalaqas: number | null // null = illimité
  maxTeachers: number | null
  maxStudents: number | null
  halaqaMaxDuration: number
  halaqaAllowRecording: boolean
}

export const PLAN_CONFIG: Record<SchoolPlan, HalaqaPlanConfig> = {
  FREE: {
    monthlyHalaqas: 1,
    maxTeachers: 1,
    maxStudents: 20,
    halaqaMaxDuration: 15,
    halaqaAllowRecording: false,
  },
  STARTER: {
    monthlyHalaqas: 2,
    maxTeachers: 2,
    maxStudents: 49,
    halaqaMaxDuration: 45,
    halaqaAllowRecording: false,
  },
  ECONOMIQUE: {
    monthlyHalaqas: 10,
    maxTeachers: 10,
    maxStudents: 199,
    halaqaMaxDuration: 60,
    halaqaAllowRecording: true,
  },
  PRO: {
    monthlyHalaqas: null,
    maxTeachers: null,
    maxStudents: 500,
    halaqaMaxDuration: 120,
    halaqaAllowRecording: true,
  },
  ENTERPRISE: {
    monthlyHalaqas: null,
    maxTeachers: null,
    maxStudents: null,
    halaqaMaxDuration: 180,
    halaqaAllowRecording: true,
  },
}

export type PlanLocale = "fr" | "en" | "ar"

export interface PlanDefinition {
  name: Record<PlanLocale, string>
  students: Record<PlanLocale, string>
  monthlyPrice: number
  yearlyPrice: number
  currency: string
  features: Record<PlanLocale, string[]>
  popular: boolean
  limits: HalaqaPlanConfig
}

export const PLANS: Record<SchoolPlan, PlanDefinition> = {
  FREE: {
    name: { fr: "Gratuit", en: "Free", ar: "مجاني" },
    students: { fr: "Jusqu'à 20 élèves", en: "Up to 20 students", ar: "حتى 20 طالب" },
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: "CAD",
    features: {
      fr: ["Gestion des élèves", "1 enseignant", "1 Halaqa/mois", "Durée max 15 min", "Support email"],
      en: ["Student management", "1 teacher", "1 Halaqa/month", "Max duration 15 min", "Email support"],
      ar: ["إدارة الطلاب", "1 معلم", "1 حلقة/شهر", "المدة القصوى 15 دقيقة", "دعم بالبريد"],
    },
    popular: false,
    limits: PLAN_CONFIG.FREE,
  },
  STARTER: {
    name: { fr: "Starter", en: "Starter", ar: "بداية" },
    students: { fr: "21 - 49 élèves", en: "21 - 49 students", ar: "21 - 49 طالب" },
    monthlyPrice: 49,
    yearlyPrice: 675,
    currency: "CAD",
    features: {
      fr: ["Gestion des élèves et enseignants", "2 enseignants", "2 Halaqas/mois", "Durée max 45 min", "Rapports basiques"],
      en: ["Student & teacher management", "2 teachers", "2 Halaqas/month", "Max duration 45 min", "Basic reports"],
      ar: ["إدارة الطلاب والمعلمين", "2 معلم", "2 حلقة/شهر", "المدة القصوى 45 دقيقة", "تقارير أساسية"],
    },
    popular: false,
    limits: PLAN_CONFIG.STARTER,
  },
  ECONOMIQUE: {
    name: { fr: "Économique", en: "Economique", ar: "اقتصادي" },
    students: { fr: "50 - 199 élèves", en: "50 - 199 students", ar: "50 - 199 طالب" },
    monthlyPrice: 79,
    yearlyPrice: 875,
    currency: "CAD",
    features: {
      fr: ["Tout du plan Starter", "10 enseignants", "10 Halaqas/mois", "Durée max 60 min", "Notifications push", "Exports PDF"],
      en: ["Everything in Starter", "10 teachers", "10 Halaqas/month", "Max duration 60 min", "Push notifications", "PDF exports"],
      ar: ["كل مميزات Starter", "10 معلمين", "10 حلقات/شهر", "المدة القصوى 60 دقيقة", "إشعارات فورية", "تصدير PDF"],
    },
    popular: true,
    limits: PLAN_CONFIG.ECONOMIQUE,
  },
  PRO: {
    name: { fr: "Pro", en: "Pro", ar: "احترافي" },
    students: { fr: "200 - 500 élèves", en: "200 - 500 students", ar: "200 - 500 طالب" },
    monthlyPrice: 99,
    yearlyPrice: 1099,
    currency: "CAD",
    features: {
      fr: ["Tout du plan Économique", "Enseignants illimités", "Halaqas illimitées", "Durée max 120 min", "Tableau de bord avancé", "Support prioritaire"],
      en: ["Everything in Economique", "Unlimited teachers", "Unlimited Halaqas", "Max duration 120 min", "Advanced dashboard", "Priority support"],
      ar: ["كل مميزات Economique", "معلمين غير محدودين", "حلقات غير محدودة", "المدة القصوى 120 دقيقة", "لوحة معلومات متقدمة", "دعم أولوي"],
    },
    popular: false,
    limits: PLAN_CONFIG.PRO,
  },
  ENTERPRISE: {
    name: { fr: "Entreprise", en: "Enterprise", ar: "مؤسسي" },
    students: { fr: "500+ élèves", en: "500+ students", ar: "500+ طالب" },
    monthlyPrice: 199,
    yearlyPrice: 2199,
    currency: "CAD",
    features: {
      fr: ["Tout du plan Pro", "Élèves illimités", "Enseignants illimités", "Halaqas illimitées", "Durée max 180 min", "Support dédié"],
      en: ["Everything in Pro", "Unlimited students", "Unlimited teachers", "Unlimited Halaqas", "Max duration 180 min", "Dedicated support"],
      ar: ["كل مميزات Pro", "طلاب غير محدودين", "معلمين غير محدودين", "حلقات غير محدودة", "المدة القصوى 180 دقيقة", "دعم مخصص"],
    },
    popular: false,
    limits: PLAN_CONFIG.ENTERPRISE,
  },
}

export interface QuotaStatus {
  plan: SchoolPlan
  billingCycle: BillingCycle
  periodStart: Date
  monthlyLimit: number | null
  bonusCredits: number
  bonusExpiry: Date | null
  plannedCount: number
  sessionsUsed: number
  totalAllowed: number // Infinity représenté par Number.MAX_SAFE_INTEGER
  totalConsumed: number
  remaining: number
  isUnlimited: boolean
  halaqaMaxDuration: number
  maxTeachers: number
  maxStudents: number
}

/**
 * Calcule le début de la période en cours selon le cycle de facturation.
 * Gère correctement les mois à 28/30/31 jours.
 */
export function getPeriodStart(
  billingCycle: BillingCycle,
  subscriptionStart: Date,
  referenceDate = new Date()
): Date {
  if (billingCycle === "MONTHLY") {
    const lastDayOfCurrentMonth = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth() + 1,
      0
    ).getDate()
    const day = Math.min(subscriptionStart.getDate(), lastDayOfCurrentMonth)
    return new Date(referenceDate.getFullYear(), referenceDate.getMonth(), day)
  }

  // YEARLY
  const now = referenceDate
  let anniversaryThisYear = new Date(
    now.getFullYear(),
    subscriptionStart.getMonth(),
    subscriptionStart.getDate()
  )

  if (anniversaryThisYear > now) {
    anniversaryThisYear = new Date(
      now.getFullYear() - 1,
      subscriptionStart.getMonth(),
      subscriptionStart.getDate()
    )
  }

  return anniversaryThisYear
}

/**
 * Vérifie si les crédits bonus ont expiré.
 */
function areBonusExpired(bonusExpiry: Date | null): boolean {
  if (!bonusExpiry) return false
  return new Date() > bonusExpiry
}

/**
 * Calcule le quota effectif total (mensuel + bonus actifs).
 */
export function getEffectiveQuota(
  monthlyLimit: number | null,
  bonusCredits: number,
  bonusExpiry: Date | null
): number {
  const effectiveBonus = areBonusExpired(bonusExpiry) ? 0 : bonusCredits
  if (monthlyLimit === null) return Number.MAX_SAFE_INTEGER
  return monthlyLimit + effectiveBonus
}

/**
 * Reset les compteurs si on est dans une nouvelle période.
 * Retourne l'école mise à jour.
 */
export async function resetHalaqaQuotaIfNeeded(schoolId: string) {
  const school = await prisma.school.findUnique({ where: { id: schoolId } })
  if (!school) return null

  const currentPeriodStart = getPeriodStart(
    school.billingCycle,
    school.subscriptionStart
  )

  if (currentPeriodStart.getTime() !== school.halaqaUsagePeriodStart.getTime()) {
    return prisma.school.update({
      where: { id: schoolId },
      data: {
        halaqaPlannedCount: 0,
        halaqaSessionsUsed: 0,
        halaqaUsagePeriodStart: currentPeriodStart,
      },
    })
  }

  return school
}

/**
 * Récupère le statut complet du quota Halaqa d'une école.
 */
export async function getHalaqaQuotaStatus(schoolId: string): Promise<QuotaStatus | null> {
  const school = await resetHalaqaQuotaIfNeeded(schoolId)
  if (!school) return null

  // Fallback sur la config du plan si le quota mensuel n'est pas explicitement défini
  // (utile pour les écoles existantes avant la migration des quotas)
  const effectiveMonthlyLimit =
    school.halaqaMonthlyLimit ?? PLAN_CONFIG[school.plan].monthlyHalaqas

  const totalAllowed = getEffectiveQuota(
    effectiveMonthlyLimit,
    school.halaqaBonusCredits,
    school.halaqaBonusExpiry
  )
  const totalConsumed = school.halaqaPlannedCount + school.halaqaSessionsUsed
  const remaining = totalAllowed === Number.MAX_SAFE_INTEGER
    ? Number.MAX_SAFE_INTEGER
    : Math.max(0, totalAllowed - totalConsumed)

  return {
    plan: school.plan,
    billingCycle: school.billingCycle,
    periodStart: school.halaqaUsagePeriodStart,
    monthlyLimit: school.halaqaMonthlyLimit,
    bonusCredits: school.halaqaBonusCredits,
    bonusExpiry: school.halaqaBonusExpiry,
    plannedCount: school.halaqaPlannedCount,
    sessionsUsed: school.halaqaSessionsUsed,
    totalAllowed,
    totalConsumed,
    remaining,
    isUnlimited: totalAllowed === Number.MAX_SAFE_INTEGER,
    halaqaMaxDuration: school.halaqaMaxDuration,
    maxTeachers: school.maxTeachers,
    maxStudents: school.maxStudents,
  }
}

export interface QuotaCheckResult {
  allowed: boolean
  reason?: string
  status: QuotaStatus
}

/**
 * Vérifie si une nouvelle session Halaqa peut être créée.
 */
export async function checkHalaqaCreationAllowed(
  schoolId: string,
  requestedDuration?: number
): Promise<QuotaCheckResult> {
  const status = await getHalaqaQuotaStatus(schoolId)
  if (!status) {
    return {
      allowed: false,
      reason: "École non trouvée",
      status: {} as QuotaStatus,
    }
  }

  if (!status.isUnlimited && status.totalConsumed >= status.totalAllowed) {
    return {
      allowed: false,
      reason: "Quota de Halaqa atteint. Passez à un plan supérieur.",
      status,
    }
  }

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { halaqaMaxDuration: true },
  })

  if (requestedDuration && school && requestedDuration > school.halaqaMaxDuration) {
    return {
      allowed: false,
      reason: `Durée max autorisée : ${school.halaqaMaxDuration} minutes`,
      status,
    }
  }

  return { allowed: true, status }
}

/**
 * Applique la configuration d'un plan à une école.
 */
export async function applyPlanConfig(schoolId: string, plan: SchoolPlan) {
  const config = PLAN_CONFIG[plan]

  return prisma.school.update({
    where: { id: schoolId },
    data: {
      plan,
      halaqaMonthlyLimit: config.monthlyHalaqas,
      maxTeachers: config.maxTeachers ?? 999999,
      maxStudents: config.maxStudents ?? 999999,
      halaqaMaxDuration: config.halaqaMaxDuration,
      halaqaAllowRecording: config.halaqaAllowRecording,
    },
  })
}

/**
 * Incrémente le compteur de sessions planifiées.
 */
export async function incrementPlannedCount(schoolId: string) {
  return prisma.school.update({
    where: { id: schoolId },
    data: { halaqaPlannedCount: { increment: 1 } },
  })
}

/**
 * Transfère une session de planned vers used (quand elle passe LIVE).
 */
export async function transferPlannedToUsed(schoolId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.school.update({
      where: { id: schoolId },
      data: {
        halaqaPlannedCount: { decrement: 1 },
        halaqaSessionsUsed: { increment: 1 },
      },
    })

    // Sécurité anti-négatif
    await tx.school.updateMany({
      where: {
        id: schoolId,
        halaqaPlannedCount: { lt: 0 },
      },
      data: {
        halaqaPlannedCount: 0,
      },
    })
  })
}

/**
 * Rembourse une session planifiée (annulation SCHEDULED).
 */
export async function refundPlannedCount(schoolId: string) {
  return prisma.school.update({
    where: { id: schoolId },
    data: { halaqaPlannedCount: { decrement: 1 } },
  })
}

/**
 * Rembourse une session utilisée (annulation LIVE rare).
 */
export async function refundUsedCount(schoolId: string) {
  return prisma.school.update({
    where: { id: schoolId },
    data: { halaqaSessionsUsed: { decrement: 1 } },
  })
}

/**
 * Vérifie si l'école peut ajouter un nouvel enseignant.
 */
export async function checkTeacherLimit(schoolId: string): Promise<{ allowed: boolean; current: number; limit: number | null }> {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { maxTeachers: true },
  })

  if (!school) return { allowed: false, current: 0, limit: null }

  const currentTeachers = await prisma.teacher.count({
    where: { user: { schoolId } },
  })

  const limit = school.maxTeachers
  const allowed = limit === 999999 || currentTeachers < limit

  return { allowed, current: currentTeachers, limit }
}
