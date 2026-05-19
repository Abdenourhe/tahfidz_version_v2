// src/app/api/admin/audit/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// Types pour les actions d'audit
type AuditAction = 
  | "CREATE_SCHOOL"
  | "UPDATE_SCHOOL"
  | "DELETE_SCHOOL"
  | "TOGGLE_SCHOOL"
  | "APPROVE_REQUEST"
  | "REJECT_REQUEST"
  | "DELETE_REQUEST"
  | "CREATE_USER"
  | "UPDATE_USER"
  | "DELETE_USER"
  | "IMPERSONATE"
  | "BROADCAST"
  | "EXPORT_DATA"
  | "CLEAR_HISTORY"

interface AuditLogEntry {
  id: string
  action: AuditAction
  actor: string          // email du super admin
  actorId: string        // id du super admin
  target: string         // nom de l'école ou de la cible
  targetId: string       // id de l'école ou de la cible
  targetType: "SCHOOL" | "REQUEST" | "USER" | "SYSTEM"
  details: string | null // JSON stringifié des détails
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
}

// GET — Récupérer les logs d'audit
export async function GET(request: Request) {
  try {
    // Vérifier l'authentification super admin
    const session = await auth()
    if (!session?.user || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Récupérer les paramètres de filtrage
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")
    const targetType = searchParams.get("targetType")
    const actorId = searchParams.get("actorId")
    const limit = parseInt(searchParams.get("limit") || "100")
    const offset = parseInt(searchParams.get("offset") || "0")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    // Construire le where
    const where: any = {}
    if (action) where.action = action
    if (targetType) where.targetType = targetType
    if (actorId) where.actorId = actorId
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }

    // Récupérer les logs
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    })

    // Compter le total
    const total = await prisma.auditLog.count({ where })

    return NextResponse.json({
      logs,
      total,
      limit,
      offset,
      hasMore: offset + logs.length < total
    })

  } catch (error) {
    console.error("Audit GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    )
  }
}

// POST — Créer un log d'audit (appelé par d'autres routes)
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const {
      action,
      target,
      targetId,
      targetType,
      details,
    }: {
      action: AuditAction
      target: string
      targetId: string
      targetType: "SCHOOL" | "REQUEST" | "USER" | "SYSTEM"
      details?: Record<string, any>
    } = await request.json()

    // Récupérer IP et User-Agent
    const headersList = request.headers
    const ipAddress = headersList.get("x-forwarded-for") || 
                      headersList.get("x-real-ip") || 
                      "unknown"
    const userAgent = headersList.get("user-agent")

    const log = await prisma.auditLog.create({
      data: {
        schoolId:   session.user.schoolId,
        userId:     session.user.id,
        action,
        entityType: targetType,
        entityId:   targetId,
        newValues:  details ? { actor: session.user.email, target, ...details } : { actor: session.user.email, target },
        ipAddress,
        userAgent,
      }
    })

    return NextResponse.json({ success: true, log })

  } catch (error) {
    console.error("Audit POST error:", error)
    return NextResponse.json(
      { error: "Failed to create audit log" },
      { status: 500 }
    )
  }
}

// DELETE — Supprimer les vieux logs (cleanup)
export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get("days") || "90")

    // Supprimer les logs plus vieux que X jours
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    
    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate }
      }
    })

    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `${result.count} log(s) supprimé(s) (plus vieux que ${days} jours)`
    })

  } catch (error) {
    console.error("Audit DELETE error:", error)
    return NextResponse.json(
      { error: "Failed to cleanup audit logs" },
      { status: 500 }
    )
  }
}