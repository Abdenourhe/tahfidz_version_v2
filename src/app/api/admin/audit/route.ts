// src/app/api/admin/audit/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

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
  actor: string
  actorId: string
  target: string
  targetId: string
  targetType: "SCHOOL" | "REQUEST" | "USER" | "SYSTEM"
  details: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

function transformLog(log: any): AuditLogEntry {
  const newValues = (log.newValues as Record<string, any>) || {}
  const oldValues = (log.oldValues as Record<string, any>) || {}

  return {
    id: log.id,
    action: log.action as AuditAction,
    actor: newValues.actor || log.user?.email || log.user?.fullName || "Système",
    actorId: log.userId,
    target: newValues.target || oldValues.target || log.entityId || "—",
    targetId: log.entityId || "—",
    targetType: (log.entityType as any) || "SYSTEM",
    details: newValues.details ? JSON.stringify(newValues.details) : null,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    createdAt: log.createdAt.toISOString(),
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")
    const targetType = searchParams.get("targetType")
    const actorId = searchParams.get("actorId")
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500)
    const offset = parseInt(searchParams.get("offset") || "0")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    const where: any = {}
    if (action) where.action = action
    if (targetType) where.entityType = targetType
    if (actorId) where.userId = actorId
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        user: { select: { email: true, fullName: true } },
      },
    })

    const total = await prisma.auditLog.count({ where })

    const transformedLogs: AuditLogEntry[] = logs.map(transformLog)

    return NextResponse.json({
      logs: transformedLogs,
      total,
      limit,
      offset,
      hasMore: offset + logs.length < total,
    })

  } catch (error) {
    console.error("Audit GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    )
  }
}

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

    const headersList = request.headers
    const ipAddress = headersList.get("x-forwarded-for") ||
                      headersList.get("x-real-ip") ||
                      "unknown"
    const userAgent = headersList.get("user-agent")

    const newValues: Record<string, any> = {
      actor: session.user.email || session.user.name || "unknown",
      target,
    }
    if (details) {
      newValues.details = details
    }

    const log = await prisma.auditLog.create({
      data: {
        schoolId: session.user.schoolId || "system",
        userId: session.user.id,
        action,
        entityType: targetType,
        entityId: targetId,
        newValues: newValues as any,
        ipAddress,
        userAgent,
      } as any,
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

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get("days") || "90")

    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    })

    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `${result.count} log(s) supprimé(s) (plus vieux que ${days} jours)`,
    })

  } catch (error) {
    console.error("Audit DELETE error:", error)
    return NextResponse.json(
      { error: "Failed to cleanup audit logs" },
      { status: 500 }
    )
  }
}