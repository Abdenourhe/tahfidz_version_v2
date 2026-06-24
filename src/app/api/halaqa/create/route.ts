// src/app/api/halaqa/create/route.ts
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createMeeting, generateMeetingID, generatePassword, joinMeetingUrl } from "@/lib/bigbluebutton"
import { checkHalaqaCreationAllowed } from "@/lib/halaqa-quota"
import { notifyHalaqaParticipants } from "@/lib/halaqa-notifications"
import { NextResponse } from "next/server"
import { z } from "zod"

const recurrenceSchema = z.object({
  frequency: z.enum(["DAILY", "WEEKLY"]),
  occurrences: z.number().min(2).max(10),
})

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
  teacherId: z.string().optional(),
  recurrence: recurrenceSchema.optional(),
})

function addRecurrence(date: Date, frequency: "DAILY" | "WEEKLY", index: number): Date {
  const d = new Date(date)
  if (frequency === "DAILY") {
    d.setDate(d.getDate() + index)
  } else {
    d.setDate(d.getDate() + index * 7)
  }
  return d
}

async function createSingleHalaqa(
  data: z.infer<typeof createSchema>,
  schoolId: string,
  teacherId: string,
  teacherName: string,
  scheduledAt: Date
) {
  const meetingID = generateMeetingID(teacherId)
  const moderatorPW = generatePassword()
  const attendeePW = generatePassword()
  const guestPW = generatePassword()

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
    maxParticipants: data.type === "INDIVIDUAL" ? 5 : 30,
  })

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

  const guestUrl = joinMeetingUrl({
    meetingID,
    fullName: "Parent",
    password: guestPW,
    role: "VIEWER",
    guest: true,
  })

  const [halaqaSession] = await prisma.$transaction(async (tx) => {
    const session = await tx.halaqaSession.create({
      data: {
        meetingID,
        meetingName: data.meetingName,
        roomUrl,
        attendeeUrl,
        guestUrl,
        schoolId,
        teacherId,
        studentIds: data.studentIds,
        groupId: data.groupId || null,
        type: data.type,
        mode: data.mode,
        status: "SCHEDULED",
        scheduledAt,
        duration: data.duration,
        sourah: data.sourah || null,
        verses: data.verses || null,
      },
      include: {
        teacher: { select: { fullName: true, email: true } },
      },
    })

    await tx.school.update({
      where: { id: schoolId },
      data: { halaqaPlannedCount: { increment: 1 } },
    })

    return [session]
  })

  await notifyHalaqaParticipants(halaqaSession, "halaqa_scheduled", [teacherId])
  return halaqaSession
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { schoolId, id: callerId, role } = session.user
    if (!["ADMIN", "TEACHER", "SUPERADMIN"].includes(role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data

    // ─── Résolution de l'enseignant assigné ───────────────────────────
    let teacherId = callerId
    let teacherName = session.user.name || "Enseignant"
    if (data.teacherId) {
      if (!["ADMIN", "SUPERADMIN"].includes(role)) {
        return NextResponse.json({ error: "Non autorisé à assigner un autre enseignant" }, { status: 403 })
      }
      const assignedTeacher = await prisma.user.findFirst({
        where: { id: data.teacherId, schoolId, role: "TEACHER", isActive: true },
        select: { id: true, fullName: true },
      })
      if (!assignedTeacher) {
        return NextResponse.json({ error: "Enseignant invalide ou inactif" }, { status: 400 })
      }
      teacherId = assignedTeacher.id
      teacherName = assignedTeacher.fullName || "Enseignant"
    }

    // ─── Vérification des élèves ──────────────────────────────────────
    const validStudents = await prisma.user.findMany({
      where: {
        id: { in: data.studentIds },
        schoolId,
        role: "STUDENT",
        isActive: true,
      },
      select: { id: true },
    })

    const validStudentIds = validStudents.map((s) => s.id)
    const invalidStudentIds = data.studentIds.filter((id) => !validStudentIds.includes(id))

    if (invalidStudentIds.length > 0) {
      return NextResponse.json(
        {
          error: "Certains élèves sont invalides ou n'appartiennent pas à votre école.",
          invalidStudentIds,
        },
        { status: 400 }
      )
    }

    const baseDate = new Date(data.scheduledAt)
    const occurrences = data.recurrence?.occurrences ?? 1
    const frequency = data.recurrence?.frequency ?? "DAILY"

    // ─── Vérification du quota pour toutes les occurrences ────────────
    for (let i = 0; i < occurrences; i++) {
      const quotaCheck = await checkHalaqaCreationAllowed(schoolId, data.duration)
      if (!quotaCheck.allowed) {
        return NextResponse.json(
          {
            error: `Quota insuffisant pour créer ${occurrences} séances. ${quotaCheck.reason}`,
            quota: quotaCheck.status,
            createdCount: i,
          },
          { status: 403 }
        )
      }
    }

    // ─── Création des séances ─────────────────────────────────────────
    const createdSessions = []
    for (let i = 0; i < occurrences; i++) {
      const scheduledAt = addRecurrence(baseDate, frequency, i)
      const halaqaSession = await createSingleHalaqa(data, schoolId, teacherId, teacherName, scheduledAt)
      createdSessions.push(halaqaSession)
    }

    return NextResponse.json(
      {
        session: createdSessions[0],
        sessions: createdSessions,
        count: createdSessions.length,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("[HALAQA CREATE ERROR]", error?.message || String(error))
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
