// src/app/api/halaqa/end/route.ts
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { endMeeting } from "@/lib/bigbluebutton"
import { NextResponse } from "next/server"
import { z } from "zod"

const endSchema = z.object({
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
    const parsed = endSchema.safeParse(body)
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

    // Seul le prof ou un admin peut terminer
    const isTeacher = halaqaSession.teacherId === userId
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(role)
    if (!isTeacher && !isAdmin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    if (halaqaSession.status === "ENDED" || halaqaSession.status === "CANCELLED") {
      return NextResponse.json({ error: "Session déjà terminée" }, { status: 400 })
    }

    // Appel BBB end (le mot de passe est dans l'URL roomUrl, on l'extrait)
    try {
      const url = new URL(halaqaSession.roomUrl)
      const pw = url.searchParams.get("password")
      if (pw) {
        await endMeeting(halaqaSession.meetingID, pw)
      }
    } catch (bbbErr: any) {
      console.warn("[HALAQA END BBB WARN]", bbbErr?.message)
      // On continue quand même pour marquer comme terminée dans Prisma
    }

    // Mettre à jour Prisma
    const updated = await prisma.halaqaSession.update({
      where: { id: sessionId },
      data: {
        status: "ENDED",
        endedAt: new Date(),
      },
    })

    return NextResponse.json({ session: updated }, { status: 200 })
  } catch (error: any) {
    console.error("[HALAQA END ERROR]", error?.message || String(error))
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
