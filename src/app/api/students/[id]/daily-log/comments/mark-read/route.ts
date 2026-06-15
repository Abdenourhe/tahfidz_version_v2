// src/app/api/students/[id]/daily-log/comments/mark-read/route.ts
// POST: Marquer comme lus les commentaires d'un dailyLog (ou d'une section)

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
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

    if (!dailyLogId) {
      return NextResponse.json({ error: "dailyLogId requis" }, { status: 400 })
    }

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

    const where: any = {
      dailyLogId,
      userId: { not: userId },
      reads: { none: { userId } },
    }
    if (section) where.section = section

    const unreadComments = await prisma.dailyLogComment.findMany({
      where,
      select: { id: true },
    })

    if (unreadComments.length > 0) {
      await prisma.dailyLogCommentRead.createMany({
        data: unreadComments.map((c) => ({
          commentId: c.id,
          userId,
        })),
        skipDuplicates: true,
      })
    }

    return NextResponse.json({ markedCount: unreadComments.length })
  } catch (error: any) {
    console.error("[DAILY_LOG_COMMENTS MARK-READ]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}
