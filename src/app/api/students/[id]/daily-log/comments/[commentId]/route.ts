// src/app/api/students/[id]/daily-log/comments/[commentId]/route.ts
// DELETE: Delete a comment (author, admin, or teacher only)

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { deleteObject } from "@/lib/r2"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { commentId } = await params

    const comment = await prisma.dailyLogComment.findUnique({
      where: { id: commentId },
      include: {
        dailyLog: { include: { student: { include: { teacher: { select: { userId: true } } } } } },
      },
    })
    const attachmentKey = comment?.attachmentKey
    if (!comment) {
      return NextResponse.json({ error: "Commentaire introuvable" }, { status: 404 })
    }

    const canDelete =
      session.user.role === "ADMIN" ||
      session.user.role === "SUPERADMIN" ||
      comment.userId === session.user.id ||
      comment.dailyLog.student.teacher?.userId === session.user.id

    if (!canDelete) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    await prisma.dailyLogComment.delete({ where: { id: commentId } })

    if (attachmentKey) {
      try {
        await deleteObject(attachmentKey)
      } catch (e) {
        console.error("[DELETE R2 OBJECT]", e)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[DAILY_LOG_COMMENT DELETE]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}
