// src/app/api/halaqa/cancel/route.ts
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { endMeeting } from "@/lib/bigbluebutton"
import { notifyHalaqaParticipants } from "@/lib/halaqa-notifications"
import { NextResponse } from "next/server"
import { z } from "zod"

const cancelSchema = z.object({
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
    const parsed = cancelSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { sessionId } = parsed.data
    const halaqaSession = await prisma.halaqaSession.findUnique({
      where: { id: sessionId },
    })

    if (!halaqaSession) {
      return NextResponse.json({ error: "Session non trouvée" }, { status: 404 })
    }

    // Seul le prof ou un admin peut annuler
    const isTeacher = halaqaSession.teacherId === userId
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(role)
    if (!isTeacher && !isAdmin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const originalStatus = halaqaSession.status

    if (originalStatus === "ENDED" || originalStatus === "CANCELLED") {
      return NextResponse.json({ error: "Session déjà terminée ou annulée" }, { status: 400 })
    }

    // Si la session est en direct, tenter de la clôturer côté BBB
    if (originalStatus === "LIVE") {
      try {
        const url = new URL(halaqaSession.roomUrl)
        const pw = url.searchParams.get("password")
        if (pw) {
          await endMeeting(halaqaSession.meetingID, pw)
        }
      } catch (bbbErr: any) {
        console.warn("[HALAQA CANCEL BBB WARN]", bbbErr?.message)
      }
    }

    // Mettre à jour Prisma + rembourser le quota
    const [updated] = await prisma.$transaction(async (tx) => {
      const session = await tx.halaqaSession.update({
        where: { id: sessionId },
        data: {
          status: "CANCELLED",
          endedAt: new Date(),
        },
      })

      // Rembourser le quota selon le statut d'origine
      if (originalStatus === "SCHEDULED") {
        await tx.school.update({
          where: { id: halaqaSession.schoolId },
          data: { halaqaPlannedCount: { decrement: 1 } },
        })
      } else if (originalStatus === "LIVE") {
        await tx.school.update({
          where: { id: halaqaSession.schoolId },
          data: { halaqaSessionsUsed: { decrement: 1 } },
        })
      }

      return [session]
    })

    // Notifier les participants
    await notifyHalaqaParticipants(updated, "halaqa_cancelled", [userId])

    return NextResponse.json({ session: updated }, { status: 200 })
  } catch (error: any) {
    console.error("[HALAQA CANCEL ERROR]", error?.message || String(error))
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
