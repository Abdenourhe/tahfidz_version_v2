// src/app/api/halaqa/recordings/route.ts
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
    const sessionId = searchParams.get("sessionId")

    const where: any = { schoolId }

    if (sessionId) {
      where.id = sessionId
    }

    // Filtrer selon le rôle
    if (role === "TEACHER") {
      where.teacherId = userId
    } else if (role === "STUDENT") {
      where.studentIds = { has: userId }
    } else if (role === "PARENT") {
      // Les parents voient les sessions de leurs enfants
      const parent = await prisma.parent.findUnique({
        where: { userId },
        include: {
          childrenLinks: {
            include: { student: { select: { userId: true } } },
          },
        },
      })
      const childUserIds = parent?.childrenLinks.map((l) => l.student.userId) ?? []
      where.studentIds = { hasSome: childUserIds }
    }

    // Récupérer les sessions avec enregistrement
    const sessions = await prisma.halaqaSession.findMany({
      where: { ...where, recordingUrl: { not: null } },
      include: {
        teacher: { select: { fullName: true } },
        evaluations: {
          where: { studentId: userId },
          select: { id: true, memorizationScore: true },
        },
      },
      orderBy: { endedAt: "desc" },
      take: 50,
    })

    return NextResponse.json({ recordings: sessions }, { status: 200 })
  } catch (error: any) {
    console.error("[HALAQA RECORDINGS ERROR]", error?.message || String(error))
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
