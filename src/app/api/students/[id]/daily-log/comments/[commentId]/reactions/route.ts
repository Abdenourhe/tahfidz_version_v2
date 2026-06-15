// src/app/api/students/[id]/daily-log/comments/[commentId]/reactions/route.ts
// POST: Ajouter ou retirer une réaction sur un commentaire (toggle)

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id: studentId, commentId } = await params
    const body = await req.json()
    const { emoji } = body

    if (!emoji) {
      return NextResponse.json({ error: "Emoji requis" }, { status: 400 })
    }

    // Vérifier l'accès à l'élève
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

    // Vérifier que le commentaire appartient bien à cet élève
    const comment = await prisma.dailyLogComment.findUnique({
      where: { id: commentId },
      include: { dailyLog: { select: { studentId: true } } },
    })
    if (!comment || comment.dailyLog.studentId !== studentId) {
      return NextResponse.json({ error: "Commentaire introuvable" }, { status: 404 })
    }

    const userId = session.user.id

    const existing = await prisma.dailyLogCommentReaction.findUnique({
      where: {
        commentId_userId_emoji: {
          commentId,
          userId,
          emoji,
        },
      },
    })

    if (existing) {
      await prisma.dailyLogCommentReaction.delete({ where: { id: existing.id } })
      return NextResponse.json({ action: "removed", emoji })
    }

    const reaction = await prisma.dailyLogCommentReaction.create({
      data: { commentId, userId, emoji },
      include: {
        user: { select: { id: true, fullName: true, role: true } },
      },
    })

    return NextResponse.json({ action: "added", reaction, emoji })
  } catch (error: any) {
    console.error("[DAILY_LOG_COMMENT_REACTION POST]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}
