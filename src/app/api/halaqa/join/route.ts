// src/app/api/halaqa/join/route.ts
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { joinMeetingUrl } from "@/lib/bigbluebutton"
import { notifyHalaqaParticipants } from "@/lib/halaqa-notifications"
import { NextResponse } from "next/server"
import { z } from "zod"

const joinSchema = z.object({
  sessionId: z.string().min(1),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id: userId, role } = session.user
    const body = await req.json()
    const parsed = joinSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { sessionId } = parsed.data
    const halaqaSession = await prisma.halaqaSession.findUnique({
      where: { id: sessionId },
      include: {
        teacher: { select: { fullName: true, email: true } },
      },
    })

    if (!halaqaSession) {
      return NextResponse.json({ error: "Session non trouvée" }, { status: 404 })
    }

    // Vérifier que l'utilisateur est autorisé
    const isTeacher = halaqaSession.teacherId === userId
    const isStudent = halaqaSession.studentIds.includes(userId)
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(role)

    let isParent = false
    if (role === "PARENT") {
      const parent = await prisma.parent.findUnique({
        where: { userId },
        include: {
          childrenLinks: {
            where: { isVerified: true },
            include: { student: { select: { userId: true } } },
          },
        },
      })
      const childUserIds = parent?.childrenLinks.map((l) => l.student.userId) ?? []
      isParent = childUserIds.some((childId) => halaqaSession.studentIds.includes(childId))
    }

    if (!isTeacher && !isStudent && !isAdmin && !isParent) {
      return NextResponse.json({ error: "Non invité à cette session" }, { status: 403 })
    }

    // Vérifier le statut
    if (halaqaSession.status === "CANCELLED") {
      return NextResponse.json({ error: "Session annulée" }, { status: 400 })
    }
    if (halaqaSession.status === "ENDED") {
      return NextResponse.json({ error: "Session terminée" }, { status: 400 })
    }

    // Mettre à jour le statut si SCHEDULED (seul prof/admin/élève démarre la session)
    // Un parent ne doit pas démarrer la session
    let becameLive = false
    if (halaqaSession.status === "SCHEDULED" && (isTeacher || isAdmin || isStudent)) {
      await prisma.$transaction(async (tx) => {
        await tx.halaqaSession.update({
          where: { id: sessionId },
          data: { status: "LIVE", startedAt: new Date() },
        })
        await tx.school.update({
          where: { id: halaqaSession.schoolId },
          data: {
            halaqaPlannedCount: { decrement: 1 },
            halaqaSessionsUsed: { increment: 1 },
          },
        })
        // Sécurité anti-négatif
        await tx.school.updateMany({
          where: {
            id: halaqaSession.schoolId,
            halaqaPlannedCount: { lt: 0 },
          },
          data: { halaqaPlannedCount: 0 },
        })
      })
      becameLive = true
    }

    // Si un parent rejoint une session SCHEDULED, on refuse (elle n'est pas encore démarrée)
    if (halaqaSession.status === "SCHEDULED" && isParent) {
      return NextResponse.json(
        { error: "La session n'a pas encore démarré. Revenez quand l'enseignant l'aura lancée." },
        { status: 400 }
      )
    }

    // Générer l'URL de join
    let joinUrl: string
    if (isTeacher || isAdmin) {
      joinUrl = halaqaSession.roomUrl
    } else if (isParent) {
      joinUrl =
        halaqaSession.guestUrl ||
        halaqaSession.attendeeUrl ||
        joinMeetingUrl({
          meetingID: halaqaSession.meetingID,
          fullName: "Parent",
          password: "",
          role: "VIEWER",
          guest: true,
        })
    } else {
      // Élève: générer une URL personnalisée avec son nom
      const userName = session.user.name || "Élève"
      joinUrl = joinMeetingUrl({
        meetingID: halaqaSession.meetingID,
        fullName: userName,
        password: "", // L'URL attendeeUrl contient déjà le mot de passe dans la query string
        role: "ATTENDEE",
        userID: userId,
      })
    }

    // Notifier les participants que la session est LIVE
    if (becameLive) {
      await notifyHalaqaParticipants(halaqaSession, "halaqa_live", [userId])
    }

    return NextResponse.json({
      joinUrl,
      mode: halaqaSession.mode,
      status: "LIVE",
      isTeacher: isTeacher || isAdmin,
      isParent,
    }, { status: 200 })
  } catch (error: any) {
    console.error("[HALAQA JOIN ERROR]", error?.message || String(error))
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
