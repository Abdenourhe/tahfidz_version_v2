// src/app/api/admin/broadcast/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { message, target } = await request.json()
    if (!message?.trim()) {
      return NextResponse.json({ error: "Message requis" }, { status: 400 })
    }

    // Ecoles cibles
    const whereClause = target === "active"   ? { isActive: true }
                      : target === "inactive" ? { isActive: false }
                      : {}

    const schools = await prisma.school.findMany({
      where: whereClause,
      select: { id: true, name: true, users: { where: { role: "ADMIN", isActive: true }, select: { id: true } } },
    })

    // Envoyer une notification a chaque ADMIN de chaque ecole
    let totalNotifs = 0
    for (const school of schools) {
      const adminIds = school.users.map(u => u.id)
      if (adminIds.length === 0) continue
      await prisma.notification.createMany({
        data: adminIds.map(userId => ({
          schoolId: school.id,
          userId,
          type:     "announcement",
          title:    "Message de la plateforme TAHFIDZ",
          message:  message.trim(),
        })),
      })
      totalNotifs += adminIds.length
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        schoolId:   session.user.schoolId || schools[0]?.id || "",
        userId:     session.user.id,
        action:     "BROADCAST",
        entityType: "SYSTEM",
        entityId:   null,
        newValues:  { message: message.slice(0, 200), target, schoolCount: schools.length, notifCount: totalNotifs },
      },
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      schoolCount: schools.length,
      notifCount:  totalNotifs,
    })

  } catch (error) {
    console.error("Broadcast error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Retourner les derniers audit logs de broadcast
    const logs = await prisma.auditLog.findMany({
      where:   { action: "BROADCAST" },
      orderBy: { createdAt: "desc" },
      take:    20,
      select:  { id: true, newValues: true, createdAt: true, userId: true },
    })

    return NextResponse.json({ broadcasts: logs })
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}
