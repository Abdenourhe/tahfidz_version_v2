// src/app/api/students/[id]/daily-log/comments/route.ts
// GET: List comments for a daily log section, or all sections if section=ALL
// POST: Add a comment

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { sendPushToUsers } from "@/lib/web-push"

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
    const { dailyLogId, section, message, attachment } = body
    const hasAttachment = attachment?.key && attachment?.type

    if (!dailyLogId || !section || (!message?.trim() && !hasAttachment)) {
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
        message: message?.trim() || "",
        attachmentKey: hasAttachment ? attachment.key : null,
        attachmentName: hasAttachment ? attachment.name || null : null,
        attachmentType: hasAttachment ? attachment.type : null,
        reads: {
          create: { userId: session.user.id },
        },
      },
      include: {
        user: { select: { id: true, fullName: true, fullNameAr: true, role: true, avatar: true } },
        reads: { where: { userId: session.user.id }, select: { id: true } },
        reactions: { select: { emoji: true, userId: true } },
      },
    })

    // Notifier les autres participants par push
    const recipients = new Set<string>()
    const isTeacherLike =
      session.user.role === "TEACHER" ||
      session.user.role === "ADMIN" ||
      session.user.role === "SUPERADMIN"
    const isParent = session.user.role === "PARENT"

    if (isTeacherLike) {
      student.parentLinks.forEach((l) => recipients.add(l.parent.userId))
    }
    if (isParent || session.user.role === "ADMIN" || session.user.role === "SUPERADMIN") {
      if (student.teacher?.userId) recipients.add(student.teacher.userId)
    }
    recipients.delete(session.user.id)

    if (recipients.size > 0) {
      const senderName = comment.user.fullName || "Quelqu'un"
      const sectionLabels: Record<string, string> = {
        ATTENDANCE: "Présence",
        HIFZ: "Hifz",
        MURAJA: "Muraja'a",
        TALQIN: "Talqin",
        COURSE: "Cours",
        GENERAL: "Général",
      }
      sendPushToUsers(Array.from(recipients), {
        title: "Nouveau message — TAHFIDZ",
        body: `${senderName} a commenté ${sectionLabels[section] || section}`,
        url: `/parent/child/${studentId}`,
        tag: `daily-log-${dailyLogId}-${section}`,
      }).catch((e) => console.error("[PUSH COMMENT]", e))
    }

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error: any) {
    console.error("[DAILY_LOG_COMMENTS POST]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}
