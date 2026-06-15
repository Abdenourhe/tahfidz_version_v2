// src/app/api/students/[id]/daily-log/comments/route.ts
// GET: List comments for a daily log section, or all sections if section=ALL
// POST: Add a comment

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const ALL_SECTIONS = ["ATTENDANCE", "HIFZ", "MURAJA", "TALQIN", "COURSE", "GENERAL"]

const commentInclude = (userId: string) => ({
  user: { select: { id: true, fullName: true, fullNameAr: true, role: true, avatar: true } },
  reads: { where: { userId }, select: { id: true } },
  reactions: { select: { emoji: true, userId: true } },
})

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id: studentId } = await params
    const { searchParams } = new URL(req.url)
    const dailyLogId = searchParams.get("dailyLogId")
    const section = searchParams.get("section")

    if (!dailyLogId) {
      return NextResponse.json({ error: "dailyLogId requis" }, { status: 400 })
    }

    // Vérifier que l'utilisateur a accès à cet élève
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        teacher: { select: { userId: true } },
        parentLinks: { where: { isVerified: true }, include: { parent: { select: { userId: true } } } },
        user: { select: { schoolId: true } },
      },
    })
    if (!student) {
      return NextResponse.json({ error: "Élève introuvable" }, { status: 404 })
    }

    const isAuthorized =
      session.user.role === "ADMIN" ||
      session.user.role === "SUPERADMIN" ||
      student.teacher?.userId === session.user.id ||
      student.parentLinks.some((l) => l.parent.userId === session.user.id) ||
      student.user.schoolId === session.user.schoolId

    if (!isAuthorized) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const userId = session.user.id

    // Mode section unique (compatibilité avec DailyLogSectionThread)
    if (section && section !== "ALL") {
      const comments = await prisma.dailyLogComment.findMany({
        where: { dailyLogId, section },
        include: commentInclude(userId),
        orderBy: { createdAt: "asc" },
      })

      const unreadCount = comments.filter((c) => c.userId !== userId && c.reads.length === 0).length

      return NextResponse.json({ comments, unreadCount })
    }

    // Mode toutes les sections (pour le drawer de discussion)
    const allComments = await prisma.dailyLogComment.findMany({
      where: { dailyLogId },
      include: commentInclude(userId),
      orderBy: { createdAt: "asc" },
    })

    const sections: Record<string, { comments: typeof allComments; unreadCount: number }> = {}
    for (const key of ALL_SECTIONS) {
      const list = allComments.filter((c) => c.section === key)
      sections[key] = {
        comments: list,
        unreadCount: list.filter((c) => c.userId !== userId && c.reads.length === 0).length,
      }
    }

    return NextResponse.json({ sections })
  } catch (error: any) {
    console.error("[DAILY_LOG_COMMENTS GET]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}

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
    const { dailyLogId, section, message } = body

    if (!dailyLogId || !section || !message?.trim()) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 })
    }

    // Verify user has access to this student
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

    const comment = await prisma.dailyLogComment.create({
      data: {
        dailyLogId,
        section,
        userId: session.user.id,
        message: message.trim(),
        reads: {
          create: { userId: session.user.id },
        },
      },
      include: {
        user: { select: { id: true, fullName: true, fullNameAr: true, role: true, avatar: true } },
        reads: { where: { userId: session.user.id }, select: { id: true } },
      },
    })

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error: any) {
    console.error("[DAILY_LOG_COMMENTS POST]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}
