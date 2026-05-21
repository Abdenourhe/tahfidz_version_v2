// src/app/superadmin/audit/page.tsx
// Page Audit SuperAdmin — serveur + données initiales

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { AuditLogClient } from "@/components/superadmin/AuditLogClient"
import type { AuditAction } from "@/lib/audit"

export const metadata = {
  title: "Audit & Logs — SuperAdmin",
  description: "Historique complet des actions sur la plateforme",
}

// ── Types pour le client ───────────────────────────────────────────

export interface AuditLogItem {
  id: string
  action: string
  actorId: string
  actorRole: string
  actorEmail: string
  actorName: string
  targetType: string | null
  targetId: string | null
  targetName: string | null
  details: string | null
  severity: string
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

interface SearchParams {
  action?: string
  severity?: string
  actorRole?: string
  targetType?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  page?: string
}

// ── Page principale ────────────────────────────────────────────────

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    redirect("/login")
  }

  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page || "1", 10))
  const pageSize = 25

  // Construire le where dynamique
  const where: any = {}

  if (sp.action && sp.action !== "all") {
    where.action = sp.action
  }
  if (sp.severity && sp.severity !== "all") {
    where.severity = sp.severity
  }
  if (sp.actorRole && sp.actorRole !== "all") {
    where.actorRole = sp.actorRole
  }
  if (sp.targetType && sp.targetType !== "all") {
    where.targetType = sp.targetType
  }
  if (sp.dateFrom || sp.dateTo) {
    where.createdAt = {}
    if (sp.dateFrom) where.createdAt.gte = new Date(sp.dateFrom)
    if (sp.dateTo) where.createdAt.lte = new Date(sp.dateTo + "T23:59:59")
  }
  if (sp.search) {
    where.OR = [
      { actorEmail: { contains: sp.search, mode: "insensitive" } },
      { actorName: { contains: sp.search, mode: "insensitive" } },
      { targetName: { contains: sp.search, mode: "insensitive" } },
      { action: { contains: sp.search, mode: "insensitive" } },
    ]
  }

  // Récupérer les logs avec pagination
  const [logs, totalCount, stats] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.groupBy({
      by: ["action"],
      _count: { action: true },
      orderBy: { _count: { action: "desc" } },
      take: 10,
    }),
  ])

  // Sérialiser les dates pour le client
  const serializedLogs: AuditLogItem[] = logs.map((log) => ({
    ...log,
    createdAt: log.createdAt.toISOString(),
  }))

  // Stats par sévérité
  const severityStats = await prisma.auditLog.groupBy({
    by: ["severity"],
    _count: { severity: true },
  })

  return (
    <AuditLogClient
      logs={serializedLogs}
      totalCount={totalCount}
      currentPage={page}
      pageSize={pageSize}
      stats={{
        topActions: stats.map((s) => ({ action: s.action, count: s._count.action })),
        severityBreakdown: severityStats.map((s) => ({
          severity: s.severity,
          count: s._count.severity,
        })),
      }}
      filters={{
        action: sp.action || "all",
        severity: sp.severity || "all",
        actorRole: sp.actorRole || "all",
        targetType: sp.targetType || "all",
        dateFrom: sp.dateFrom || "",
        dateTo: sp.dateTo || "",
        search: sp.search || "",
      }}
    />
  )
}