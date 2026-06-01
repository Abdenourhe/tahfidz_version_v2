// src/app/api/maqra/sessions/route.ts
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { schoolId, id: userId, role } = session.user
    const { searchParams } = new URL(req.url)
    const statusFilter = searchParams.get("status")

    let where: any = { schoolId }

    if (role === "TEACHER") {
      where.teacherId = userId
    } else if (role === "STUDENT") {
      where.studentIds = { has: userId }
    } else if (role === "PARENT") {
      const parent = await prisma.parent.findUnique({
        where: { userId },
        include: { childrenLinks: { include: { student: { select: { userId: true } } } } },
      })
      const childUserIds = parent?.childrenLinks.map((l) => l.student.userId) ?? []
      where.studentIds = { hasSome: childUserIds }
    }

    if (statusFilter) {
      where.status = statusFilter
    }

    const sessions = await prisma.maqraSession.findMany({
      where,
      include: {
        group: { select: { name: true } },
        evaluations: {
          select: { id: true, studentId: true, memorizationScore: true },
        },
      },
      orderBy: { scheduledAt: "desc" },
      take: 100,
    })

    return NextResponse.json({ sessions }, { status: 200 })
  } catch (error: any) {
    console.error("[MAQRA SESSIONS GET ERROR]", error?.message || String(error))
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
