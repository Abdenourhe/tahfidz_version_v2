// src/app/api/maqra/create/route.ts
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createMeeting, generateMeetingID, generatePassword, joinMeetingUrl, isConfigured } from "@/lib/bigbluebutton"
import { NextResponse } from "next/server"
import { z } from "zod"

const createSchema = z.object({
  meetingName: z.string().min(2),
  studentIds: z.array(z.string()).min(1),
  groupId: z.string().optional(),
  scheduledAt: z.string().datetime(),
  type: z.enum(["INDIVIDUAL", "COLLECTIVE"]),
  mode: z.enum(["AUDIO_ONLY", "VIDEO", "SCREEN_SHARE"]),
  sourah: z.string().optional(),
  verses: z.string().optional(),
  duration: z.number().min(15).max(180).optional().default(60),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { schoolId, id: teacherId, role } = session.user
    if (!["ADMIN", "TEACHER", "SUPERADMIN"].includes(role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    if (!isConfigured()) {
      return NextResponse.json({ error: "BigBlueButton non configuré" }, { status: 503 })
    }

    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data
    const meetingID = generateMeetingID(teacherId)
    const moderatorPW = generatePassword()
    const attendeePW = generatePassword()

    // Créer la réunion BBB
    await createMeeting({
      meetingID,
      meetingName: data.meetingName,
      attendeePW,
      moderatorPW,
      record: true,
      autoStartRecording: false,
      allowStartStopRecording: true,
      muteOnStart: true,
      webcamsOnlyForModerator: data.mode === "AUDIO_ONLY",
      lockSettingsDisableCam: data.mode === "AUDIO_ONLY",
      lockSettingsDisableMic: false,
      welcome: `Bienvenue dans votre Halaqa Online. Préparez votre mushaf.`,
      duration: data.duration,
      maxParticipants: data.type === "INDIVIDUAL" ? 3 : 30,
    })

    // Générer URLs
    const teacherName = session.user.name || "Enseignant"
    const roomUrl = joinMeetingUrl({
      meetingID,
      fullName: teacherName,
      password: moderatorPW,
      role: "MODERATOR",
      userID: teacherId,
    })

    const attendeeUrl = joinMeetingUrl({
      meetingID,
      fullName: "Élève",
      password: attendeePW,
      role: "ATTENDEE",
    })

    // Sauvegarder dans Prisma
    const maqraSession = await prisma.maqraSession.create({
      data: {
        meetingID,
        meetingName: data.meetingName,
        roomUrl,
        attendeeUrl,
        schoolId,
        teacherId,
        studentIds: data.studentIds,
        groupId: data.groupId || null,
        type: data.type,
        mode: data.mode,
        status: "SCHEDULED",
        scheduledAt: new Date(data.scheduledAt),
        duration: data.duration,
        sourah: data.sourah || null,
        verses: data.verses || null,
      },
      include: {
        teacher: { select: { fullName: true, email: true } },
      },
    })

    return NextResponse.json({ session: maqraSession }, { status: 201 })
  } catch (error: any) {
    console.error("[MAQRA CREATE ERROR]", error?.message || String(error))
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
