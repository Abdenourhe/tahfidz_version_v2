// src/app/api/maqra/join/route.ts
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { joinMeetingUrl } from "@/lib/bigbluebutton"
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
    const maqraSession = await prisma.maqraSession.findUnique({
      where: { id: sessionId },
      include: {
        teacher: { select: { fullName: true, email: true } },
      },
    })

    if (!maqraSession) {
      return NextResponse.json({ error: "Session non trouvée" }, { status: 404 })
    }

    // Vérifier que l'utilisateur est autorisé
    const isTeacher = maqraSession.teacherId === userId
    const isStudent = maqraSession.studentIds.includes(userId)
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(role)

    if (!isTeacher && !isStudent && !isAdmin) {
      return NextResponse.json({ error: "Non invité à cette session" }, { status: 403 })
    }

    // Vérifier le statut
    if (maqraSession.status === "CANCELLED") {
      return NextResponse.json({ error: "Session annulée" }, { status: 400 })
    }
    if (maqraSession.status === "ENDED") {
      return NextResponse.json({ error: "Session terminée" }, { status: 400 })
    }

    // Mettre à jour le statut si SCHEDULED
    if (maqraSession.status === "SCHEDULED") {
      await prisma.maqraSession.update({
        where: { id: sessionId },
        data: { status: "LIVE", startedAt: new Date() },
      })
    }

    // Générer l'URL de join
    let joinUrl: string
    if (isTeacher || isAdmin) {
      joinUrl = maqraSession.roomUrl
    } else {
      // Élève: générer une URL personnalisée avec son nom
      const userName = session.user.name || "Élève"
      joinUrl = joinMeetingUrl({
        meetingID: maqraSession.meetingID,
        fullName: userName,
        password: "", // L'URL attendeeUrl contient déjà le mot de passe dans la query string
        role: "ATTENDEE",
        userID: userId,
      })
    }

    return NextResponse.json({
      joinUrl,
      mode: maqraSession.mode,
      status: "LIVE",
      isTeacher: isTeacher || isAdmin,
    }, { status: 200 })
  } catch (error: any) {
    console.error("[MAQRA JOIN ERROR]", error?.message || String(error))
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
