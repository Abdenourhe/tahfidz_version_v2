// src/app/api/halaqa/webhook/route.ts
// Webhook appelé par BigBlueButton quand un enregistrement est prêt

import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    // BBB envoie les événements via webhooks
    // Exemple: { event: "recording_ready", recording: { ... } }
    const event = body.event || body.payload?.event

    if (event !== "recording_ready" && event !== "rap-publish-ended") {
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    const recording = body.recording || body.payload?.recording
    if (!recording?.meetingID || !recording?.playback?.format?.url) {
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    const meetingID = recording.meetingID
    const recordingUrl = recording.playback.format.url
    const recordingId = recording.recordID

    const halaqaSession = await prisma.halaqaSession.findUnique({
      where: { meetingID },
    })

    if (!halaqaSession) {
      return NextResponse.json({ error: "Session non trouvée" }, { status: 404 })
    }

    await prisma.halaqaSession.update({
      where: { meetingID },
      data: {
        recordingUrl,
        recordingId,
        status: "ENDED",
      },
    })

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error: any) {
    console.error("[MAQRA WEBHOOK ERROR]", error?.message || String(error))
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
