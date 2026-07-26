// src/lib/audit-middleware.ts
// Middleware Prisma d'audit — isolé pour éviter l'import côté client de next/headers

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

const AUDITED_MODELS = [
  "Student", "Teacher", "Parent", "School", "User",
  "Group", "Evaluation", "Attendance", "Badge", "Announcement",
  "Broadcast", "Exam", "DirectMessage", "Feedback", "SchoolRequest",
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
