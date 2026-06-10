// src/app/api/attendance/route.ts — supports ADMIN, TEACHER, PARENT (own children) with notifications
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const recordSchema = z.object({
  studentId: z.string().min(1),
  status:    z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
  notes:     z.string().optional().nullable(),
})

const postSchema = z.object({
  groupId:    z.string().min(1),
  date:       z.string(),  // ISO string
  studentIds: z.array(z.string()).optional(),
  records:    z.array(recordSchema).min(1),
})

const STATUS_LABEL: Record<string, string> = {
  PRESENT: "Présent ✓", ABSENT: "Absent ✗", LATE: "Retard ⏱", EXCUSED: "Excusé ⓘ",
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const schoolId = session?.user?.schoolId
  if (!schoolId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const groupId   = searchParams.get("groupId")
  const studentId = searchParams.get("studentId")
  const dateFrom  = searchParams.get("dateFrom")
  const dateTo    = searchParams.get("dateTo")

  const where: Record<string, unknown> = {}

  if (session.user.role === "STUDENT") {
    const student = await prisma.student.findUnique({ where: { userId: session.user.id } })
    if (student) where.studentId = student.id
  } else if (session.user.role === "PARENT") {
    // Parent can only see their own children's attendance
    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: { childrenLinks: { where: { isVerified: true }, select: { studentId: true } } },
    })
    const childrenIds = parent?.childrenLinks.map(l => l.studentId) ?? []
    if (studentId && childrenIds.includes(studentId)) where.studentId = studentId
    else where.studentId = { in: childrenIds }
  } else if (session.user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } })
    if (teacher) {
      if (groupId)   where.groupId = groupId
      if (studentId) where.studentId = studentId
      // Else: list all attendance records for teacher's groups
      if (!groupId && !studentId) {
        const teacherGroups = await prisma.group.findMany({ where: { teacherId: teacher.id, schoolId }, select: { id: true } })
        where.groupId = { in: teacherGroups.map(g => g.id) }
      }
    }
  } else {
    // ADMIN — scope to school
    where.student = { user: { schoolId } }
    if (groupId)   where.groupId   = groupId
    if (studentId) where.studentId = studentId
  }

  if (dateFrom || dateTo) {
    where.date = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo   ? { lte: new Date(dateTo) }   : {}),
    }
  }

  const attendances = await prisma.attendance.findMany({
    where,
    include: {
      student: { include: { user: { select: { fullName: true } } } },
    },
    orderBy: { date: "desc" },
    take: 200,
  })

  // Stats per student if a group is queried
  if (groupId) {
    const students = await prisma.student.findMany({
      where: { groupId, user: { schoolId } },
      include: { user: { select: { fullName: true } } },
    })

    const stats = students.map(s => {
      const studentAtt = attendances.filter(a => a.studentId === s.id)
      const total   = studentAtt.length
      const present = studentAtt.filter(a => a.status === "PRESENT").length
      const late    = studentAtt.filter(a => a.status === "LATE").length
      return {
        studentId: s.id,
        fullName:  s.user.fullName,
        total,
        present,
        late,
        absent:   studentAtt.filter(a => a.status === "ABSENT").length,
        excused:  studentAtt.filter(a => a.status === "EXCUSED").length,
        rate:     total > 0 ? Math.round(((present + late) / total) * 100) : 0,
      }
    })

    return NextResponse.json({ attendances, stats })
  }

  return NextResponse.json({ attendances })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const schoolId = session?.user?.schoolId
  if (!schoolId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  // ADMIN, TEACHER, PARENT can record attendance
  if (!["ADMIN", "TEACHER", "PARENT"].includes(session.user.role)) {
    return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 })
  }

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Corps invalide" }, { status: 400 }) }

  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { groupId, date, records } = parsed.data

  // Validate date
  let attendanceDate: Date
  try {
    attendanceDate = new Date(date)
    if (isNaN(attendanceDate.getTime())) throw new Error()
  } catch {
    return NextResponse.json({ error: "Date invalide" }, { status: 400 })
  }
  // Normalize to start of day to avoid duplicates from time component
  attendanceDate = new Date(attendanceDate.getFullYear(), attendanceDate.getMonth(), attendanceDate.getDate())

  // Verify access for PARENT: only their own children + only future dates
  if (session.user.role === "PARENT") {
    // Normalize attendance date to start of day
    const todayNormalized = new Date()
    todayNormalized.setHours(0, 0, 0, 0)
    // Allow today and future dates (> yesterday)
    const yesterday = new Date(todayNormalized)
    yesterday.setDate(yesterday.getDate() - 1)
    if (attendanceDate <= yesterday) {
      return NextResponse.json({ error: "Vous ne pouvez signaler la présence que pour aujourd'hui ou les jours à venir" }, { status: 403 })
    }

    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: { childrenLinks: { where: { isVerified: true }, select: { studentId: true } } },
    })
    const allowedIds = new Set(parent?.childrenLinks.map(l => l.studentId) ?? [])
    const invalid = records.find(r => !allowedIds.has(r.studentId))
    if (invalid) {
      return NextResponse.json({ error: "Vous ne pouvez marquer que vos propres enfants" }, { status: 403 })
    }
  }

  // Verify access for TEACHER: only their group
  if (session.user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } })
    if (!teacher) return NextResponse.json({ error: "Profil enseignant introuvable" }, { status: 404 })
    const group = await prisma.group.findUnique({ where: { id: groupId }, select: { teacherId: true } })
    if (!group || group.teacherId !== teacher.id) {
      return NextResponse.json({ error: "Vous ne pouvez gérer que votre groupe" }, { status: 403 })
    }
  }

  // Create or update each attendance record
  const upsertResults = []
  const errors: string[] = []

  for (const record of records) {
    try {
      const result = await prisma.attendance.upsert({
        where: {
          studentId_date: {
            studentId: record.studentId,
            date:      attendanceDate,
          },
        },
        update: {
          status:     record.status,
          notes:      record.notes ?? null,
          recordedBy: session.user.id,
        },
        create: {
          studentId:  record.studentId,
          groupId,
          date:       attendanceDate,
          status:     record.status,
          notes:      record.notes ?? null,
          recordedBy: session.user.id,
        },
      })
      upsertResults.push(result)
    } catch (e) {
      errors.push(`${record.studentId}: ${e instanceof Error ? e.message : "erreur"}`)
    }
  }

  // Update lastActivityDate for present students
  const presentIds = records
    .filter(r => r.status === "PRESENT" || r.status === "LATE")
    .map(r => r.studentId)
  if (presentIds.length > 0) {
    await prisma.student.updateMany({
      where: { id: { in: presentIds } },
      data:  { lastActivityDate: new Date() },
    }).catch(() => {})
  }

  // ─── Send notifications ─────────────────────────────────────────────────
  // Get students with their user, teacher, parents
  const studentIds = records.map(r => r.studentId)
  const students = await prisma.student.findMany({
    where: { id: { in: studentIds } },
    include: {
      user:    { select: { id: true, fullName: true } },
      teacher: { include: { user: { select: { id: true } } } },
      parentLinks: {
        where: { isVerified: true },
        include: { parent: { include: { user: { select: { id: true } } } } },
      },
    },
  })

  const dateStr = attendanceDate.toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })

  for (const student of students) {
    const record = records.find(r => r.studentId === student.id)
    if (!record) continue

    const statusLabel = STATUS_LABEL[record.status] ?? record.status
    const recipientIds = new Set<string>()

    // Notify based on who recorded
    if (session.user.role === "PARENT") {
      // Parent recorded → notify teacher always
      if (student.teacher?.user?.id) recipientIds.add(student.teacher.user.id)

      // Notify admins only for ABSENT or EXCUSED (not PRESENT/LATE)
      if (record.status === "ABSENT" || record.status === "EXCUSED") {
        const admins = await prisma.user.findMany({
          where: { role: "ADMIN", isActive: true, schoolId },
          select: { id: true },
        })
        admins.forEach(a => recipientIds.add(a.id))
      }
    } else if (session.user.role === "TEACHER") {
      // Teacher recorded → notify parents (and the student themselves)
      student.parentLinks.forEach(l => recipientIds.add(l.parent.user.id))
      recipientIds.add(student.user.id)
    } else if (session.user.role === "ADMIN") {
      // Admin recorded → notify everyone (teacher + parents + student)
      if (student.teacher?.user?.id) recipientIds.add(student.teacher.user.id)
      student.parentLinks.forEach(l => recipientIds.add(l.parent.user.id))
      recipientIds.add(student.user.id)
    }

    // Don't notify self
    recipientIds.delete(session.user.id)

    if (recipientIds.size > 0) {
      const emoji = record.status === "PRESENT" ? "✅"
        : record.status === "LATE" ? "⏱"
        : record.status === "EXCUSED" ? "ⓘ"
        : "🚫"
      const isParentRecorded = session.user.role === "PARENT"
      const isFutureDate     = attendanceDate > new Date()
      const recorder         = isParentRecorded ? " (signalé par parent)" : ""
      const futureLabel      = isFutureDate ? " — Jour à venir" : ""

      // Respect attendance notification preferences
      const recipients = await prisma.user.findMany({
        where: { id: { in: [...recipientIds] } },
        select: { id: true, role: true, attendanceNotifications: true },
      })
      const enabledRecipients = recipients.filter(r => r.attendanceNotifications !== false)

      const ROLE_URL: Record<string, string> = {
        STUDENT: "/student/attendance",
        PARENT:  "/parent/attendance",
        TEACHER: "/teacher/attendance",
        ADMIN:   "/admin/attendance",
      }

      if (enabledRecipients.length > 0) {
        try {
          await prisma.notification.createMany({
            data: enabledRecipients.map(r => ({
              userId:    r.id,
              schoolId:  session.user.schoolId,
              type:      "attendance",
              title:     `${emoji} ${student.user.fullName} : ${statusLabel}${recorder}`,
              message:   `${isFutureDate ? "Prévision" : "Présence"} du ${dateStr}${futureLabel}${record.notes ? ` — Motif : ${record.notes}` : ""}`,
              data:      { studentId: student.id, status: record.status, date: attendanceDate.toISOString(), recordedBy: session.user.role, url: ROLE_URL[r.role] },
            })),
          })
        } catch {/* swallow notification errors */}
      }
    }
  }

  return NextResponse.json({
    message:   `${upsertResults.length} présence${upsertResults.length > 1 ? "s" : ""} enregistrée${upsertResults.length > 1 ? "s" : ""}`,
    succeeded: upsertResults.length,
    failed:    errors.length,
    errors:    errors.length > 0 ? errors : undefined,
  })
}
