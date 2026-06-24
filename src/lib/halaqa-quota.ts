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
