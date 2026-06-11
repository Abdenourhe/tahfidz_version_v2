// src/app/api/admin/health/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// Type pour les métriques de santé
interface HealthMetrics {
  status: "healthy" | "warning" | "critical"
  apiLatency: number
  dbStatus: "connected" | "disconnected"
  lastError: string | null
  errorCount24h: number
  uptime: string
  memoryUsage: number
  cpuLoad: number
  diskUsage: number
  activeConnections: number
  timestamp: string
}

export async function GET() {
  const startTime = Date.now()
  
  try {
    // Vérifier l'authentification super admin
    const session = await auth()
    if (!session?.user || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Test de connexion DB
    let dbStatus: "connected" | "disconnected" = "disconnected"
    let lastError: string | null = null
    let errorCount24h = 0
    
    try {
      // Ping rapide à la DB
      await prisma.$queryRaw`SELECT 1`
      dbStatus = "connected"
    } catch (dbError) {
      dbStatus = "disconnected"
      lastError = dbError instanceof Error ? dbError.message : "Database connection failed"
    }

    // Compter les erreurs des 24 dernières heures
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    try {
      const errorLogs = await (prisma as any).errorLog.count({
        where: {
          createdAt: { gte: twentyFourHoursAgo },
          severity: { in: ["ERROR", "CRITICAL"] }
        }
      })
      errorCount24h = errorLogs
    } catch {
      // Si la table n'existe pas, on met 0
      errorCount24h = 0
    }

    // Calculer la latence API (temps écoulé depuis le début de la requête)
    const apiLatency = Date.now() - startTime

    // Déterminer le statut global
    let status: "healthy" | "warning" | "critical" = "healthy"
    
    if (dbStatus === "disconnected" || apiLatency > 1000) {
      status = "critical"
    } else if (apiLatency > 500 || errorCount24h > 10) {
      status = "warning"
    }

    // Métriques système (simulées si pas d'accès direct)
    const metrics: HealthMetrics = {
      status,
      apiLatency,
      dbStatus,
      lastError,
      errorCount24h,
      uptime: process.uptime ? `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m` : "N/A",
      memoryUsage: Math.round((process.memoryUsage?.().heapUsed || 0) / 1024 / 1024),
      cpuLoad: 0, // Nécessite un module supplémentaire
      diskUsage: 0, // Nécessite un module supplémentaire
      activeConnections: 0, // À implémenter selon ton architecture
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(metrics)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    
    return NextResponse.json({
      status: "critical" as const,
      apiLatency: Date.now() - startTime,
      dbStatus: "disconnected" as const,
      lastError: errorMessage,
      errorCount24h: 1,
      uptime: "N/A",
      memoryUsage: 0,
      cpuLoad: 0,
      diskUsage: 0,
      activeConnections: 0,
      timestamp: new Date().toISOString()
    }, { status: 200 }) // On retourne 200 pour que le dashboard puisse afficher l'erreur
  }
}

// Endpoint pour enregistrer une erreur (appelé par d'autres routes)
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { message, stack, severity = "ERROR" } = await request.json()

    // Enregistrer dans la DB si la table existe
    try {
      await (prisma as any).errorLog.create({
        data: {
          message,
          stack,
          severity,
          source: "api",
          createdAt: new Date()
        }
      })
    } catch {
      // Si la table n'existe pas, on ignore silencieusement
      console.error("Failed to log error:", message)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to log error" },
      { status: 500 }
    )
  }
}