// src/app/api/students/[id]/daily-log/comments/clear-section/route.ts
// DELETE: Supprimer tous les commentaires d'une section d'un daily log
// Réservé aux admin, superadmin et enseignant de l'élève

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id: studentId } = await params
    const body = await req.json()
    const { dailyLogId, section } = body

    if (!dailyLogId || !section) {
      return NextResponse.json({ error: "dailyLogId et section requis" }, { status: 400 })
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        teacher: { select: { userId: true } },
      },
    })
    if (!student) {
      return NextResponse.json({ error: "Élève introuvable" }, { status: 404 })
    }

    const canClear =
      session.user.role === "ADMIN" ||
      session.user.role === "SUPERADMIN" ||
      student.teacher?.userId === session.user.id

    if (!canClear) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const { count } = await prisma.dailyLogComment.deleteMany({
      where: { dailyLogId, section },
    })

    return NextResponse.json({ cleared: count })
  } catch (error: any) {
    console.error("[DAILY_LOG_COMMENTS CLEAR-SECTION]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}
