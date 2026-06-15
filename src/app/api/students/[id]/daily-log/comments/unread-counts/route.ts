// src/app/api/students/[id]/daily-log/comments/unread-counts/route.ts
// GET: Nombre de commentaires non lus par dailyLog pour l'utilisateur connecté

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id: studentId } = await params

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        teacher: { select: { userId: true } },
        parentLinks: { where: { isVerified: true }, include: { parent: { select: { userId: true } } } },
      },
    })
    if (!student) {
      return NextResponse.json({ error: "Élève introuvable" }, { status: 404 })
    }

    const isAuthorized =
      session.user.role === "ADMIN" ||
      session.user.role === "SUPERADMIN" ||
      student.teacher?.userId === session.user.id ||
      student.parentLinks.some((l) => l.parent.userId === session.user.id)

    if (!isAuthorized) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const userId = session.user.id

    const comments = await prisma.dailyLogComment.findMany({
      where: {
        dailyLog: { studentId },
        userId: { not: userId },
        reads: { none: { userId } },
      },
      select: {
        dailyLogId: true,
        section: true,
      },
    })

    const counts: Record<string, { total: number; sections: Record<string, number> }> = {}
    for (const c of comments) {
      if (!counts[c.dailyLogId]) {
        counts[c.dailyLogId] = { total: 0, sections: {} }
      }
      counts[c.dailyLogId].total++
      counts[c.dailyLogId].sections[c.section] = (counts[c.dailyLogId].sections[c.section] || 0) + 1
    }

    return NextResponse.json({ counts })
  } catch (error: any) {
    console.error("[DAILY_LOG_COMMENTS UNREAD-COUNTS]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}
