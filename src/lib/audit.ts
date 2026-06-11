"use server"
// src/lib/audit.ts
// Service d'audit complet avec middleware Prisma + logs manuels

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { headers } from "next/headers"

// ── Types ──────────────────────────────────────────────────────────

export type AuditAction =
  | "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT"
  | "BROADCAST" | "SCHOOL_APPROVE" | "SCHOOL_REJECT" | "SCHOOL_SUSPEND"
  | "USER_CREATE" | "USER_UPDATE" | "USER_DELETE" | "USER_ROLE_CHANGE"
  | "STUDENT_ENROLL" | "STUDENT_TRANSFER" | "EVALUATION_GRADE"
  | "BADGE_AWARD" | "FEEDBACK_RESOLVE" | "SETTINGS_CHANGE"
  | "EXPORT" | "IMPORT" | "BACKUP"

export interface AuditLogData {
  action: AuditAction | string
  targetType?: string      // "Student", "School", "User", "Broadcast"...
  targetId?: string        // ID de la ressource
  targetName?: string      // Nom lisible (ex: "École Al-Furqan")
  details?: Record<string, any>  // Données JSON
  severity?: "INFO" | "WARNING" | "CRITICAL"  // Niveau d'importance
}

// ── Création manuelle d'un log ──────────────────────────────────────

export async function createAuditLog(data: AuditLogData) {
  try {
    const session = await auth()
    const headersList = await headers()

    // Récupérer IP et User-Agent
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
      || headersList.get("x-real-ip")
      || "unknown"
    const userAgent = headersList.get("user-agent") || "unknown"

    // Déterminer l'acteur
    const actorId = session?.user?.id || "system"
    const actorRole = session?.user?.role || "SYSTEM"
    const actorEmail = session?.user?.email || "system@tahfidz.com"
    const actorName = (session?.user as any)?.name || actorEmail

    const schoolId = (session?.user as any)?.schoolId || "system"
    const userId = session?.user?.id || "system"

    const log = await prisma.auditLog.create({
      data: {
        action: data.action,
        actorId,
        actorRole,
        actorEmail,
        actorName,
        targetType: data.targetType || null,
        targetId: data.targetId || null,
        targetName: data.targetName || null,
        details: data.details ? JSON.stringify(data.details) : null,
        severity: data.severity || "INFO",
        ipAddress: ipAddress.length > 45 ? ipAddress.slice(0, 45) : ipAddress,
        userAgent: userAgent.length > 255 ? userAgent.slice(0, 255) : userAgent,
        schoolId,
        userId,
      },
    })

    return { success: true, log }
  } catch (error) {
    console.error("[AUDIT] Failed to create audit log:", error)
    // Silencieux — l'audit ne doit jamais bloquer l'opération principale
    return { success: false, error: String(error) }
  }
}

// ── Middleware Prisma automatique ───────────────────────────────────

const AUDITED_MODELS = [
  "Student", "Teacher", "Parent", "School", "User",
  "Group", "Evaluation", "Attendance", "Badge", "Announcement",
  "Broadcast", "Exam", "DirectMessage", "Feedback", "SchoolRequest"
]

const AUDITED_ACTIONS = ["create", "update", "delete", "upsert"]

export function setupAuditMiddleware(prismaClient: typeof prisma) {
  prismaClient.$use(async (params, next) => {
    // Ne pas auditer les lectures ou les AuditLog eux-mêmes
    if (params.model === "AuditLog") return next(params)
    if (!AUDITED_MODELS.includes(params.model || "")) return next(params)
    if (!AUDITED_ACTIONS.includes(params.action)) return next(params)

    // Exécuter l'opération
    const result = await next(params)

    // Créer le log en arrière-plan (ne pas await pour ne pas bloquer)
    const actionMap: Record<string, string> = {
      create: "CREATE",
      update: "UPDATE",
      delete: "DELETE",
      upsert: "UPSERT",
    }

    // Récupérer les infos de l'acteur si possible (best effort)
    let actorId = "system"
    let actorRole = "SYSTEM"
    let actorEmail = "system@tahfidz.com"
    let actorName = "Système"

    try {
      const session = await auth()
      if (session?.user) {
        actorId = session.user.id
        actorRole = session.user.role
        actorEmail = session.user.email || ""
        actorName = (session.user as any)?.name || actorEmail
      }
    } catch {
      // Pas de session — opération système
    }

    // Construire les détails
    const details: Record<string, any> = {
      model: params.model,
      action: params.action,
    }

    if (params.args?.where) {
      details.where = params.args.where
    }
    if (params.args?.data) {
      // Pour UPDATE, stocker seulement les champs modifiés
      details.changedFields = Object.keys(params.args.data)
    }
    if (result?.id) {
      details.resultId = result.id
    }

    // Déterminer la sévérité
    let severity: "INFO" | "WARNING" | "CRITICAL" = "INFO"
    if (params.action === "delete") severity = "WARNING"
    if (params.model === "School" && params.action !== "create") severity = "CRITICAL"
    if (params.model === "User" && params.action === "delete") severity = "CRITICAL"

    // Extraire schoolId/userId si possible
    const schoolId = params.args?.data?.schoolId || params.args?.where?.schoolId || "system"
    const userId = params.args?.data?.userId || params.args?.where?.userId || actorId

    // Créer le log (fire-and-forget)
    prismaClient.auditLog.create({
      data: {
        action: actionMap[params.action] || params.action.toUpperCase(),
        actorId,
        actorRole,
        actorEmail,
        actorName,
        targetType: params.model,
        targetId: result?.id || params.args?.where?.id || null,
        targetName: result?.name || result?.fullName || result?.title || null,
        details: JSON.stringify(details),
        severity,
        ipAddress: "auto",
        userAgent: "prisma-middleware",
        schoolId: schoolId as string,
        userId: userId as string,
      },
    }).catch(() => {
      // Silencieux
    })

    return result
  })
}

// ── Helpers pour les actions fréquentes ───────────────────────────

export async function auditLogin(userId: string, email: string, _role: string) {
  return createAuditLog({
    action: "LOGIN",
    targetType: "User",
    targetId: userId,
    targetName: email,
    details: { method: "credentials" },
    severity: "INFO",
  })
}

export async function auditLogout(userId: string) {
  return createAuditLog({
    action: "LOGOUT",
    targetType: "User",
    targetId: userId,
    severity: "INFO",
  })
}

export async function auditSchoolAction(
  action: "SCHOOL_APPROVE" | "SCHOOL_REJECT" | "SCHOOL_SUSPEND",
  schoolId: string,
  schoolName: string,
  reason?: string
) {
  return createAuditLog({
    action,
    targetType: "School",
    targetId: schoolId,
    targetName: schoolName,
    details: { reason },
    severity: "CRITICAL",
  })
}

export async function auditBroadcast(message: string, target: string, recipientsCount: number) {
  return createAuditLog({
    action: "BROADCAST",
    targetType: "Broadcast",
    details: { message: message.slice(0, 200), target, recipientsCount },
    severity: "WARNING",
  })
}

export async function auditExport(format: string, model: string, count: number) {
  return createAuditLog({
    action: "EXPORT",
    targetType: model,
    details: { format, count, timestamp: new Date().toISOString() },
    severity: "INFO",
  })
}