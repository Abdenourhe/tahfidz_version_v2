// src/app/api/students/[id]/daily-log/route.ts
// GET: récupérer le log d'un jour (ou les derniers)
// POST: créer un log
// PATCH: mettre à jour un log existant

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const LogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hifzFromSurahId: z.number().optional().nullable(),
  hifzFromVerse: z.number().optional().nullable(),
  hifzToSurahId: z.number().optional().nullable(),
  hifzToVerse: z.number().optional().nullable(),
  hifzNote: z.string().optional().nullable(),
  murajaFromSurahId: z.number().optional().nullable(),
  murajaFromVerse: z.number().optional().nullable(),
  murajaToSurahId: z.number().optional().nullable(),
  murajaToVerse: z.number().optional().nullable(),
  murajaNote: z.string().optional().nullable(),
  talqinFromSurahId: z.number().optional().nullable(),
  talqinFromVerse: z.number().optional().nullable(),
  talqinToSurahId: z.number().optional().nullable(),
  talqinToVerse: z.number().optional().nullable(),
  talqinNote: z.string().optional().nullable(),
  courseBook: z.string().optional().nullable(),
  courseFromPage: z.number().optional().nullable(),
  courseToPage: z.number().optional().nullable(),
  courseNote: z.string().optional().nullable(),
  attendanceStatus: z.string().optional().nullable(),
  teacherObservation: z.string().optional().nullable(),
  parentObservation: z.string().optional().nullable(),
  globalScore: z.number().optional().nullable(),
})

async function canAccessStudent(session: any, studentId: string) {
  if (!session?.user) return false
  const role = session.user.role
  if (role === "SUPERADMIN") return true

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { user: { select: { schoolId: true } }, teacherId: true },
  })
  if (!student) return false

  if (role === "ADMIN" && student.user.schoolId === session.user.schoolId) return true

  if (role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } })
    if (teacher && student.teacherId === teacher.id) return true
  }

  if (role === "PARENT") {
    const parent = await prisma.parent.findUnique({ where: { userId: session.user.id } })
    if (!parent) return false
    const link = await prisma.parentStudentLink.findFirst({
      where: { parentId: parent.id, studentId, isVerified: true },
    })
    return !!link
  }

  return false
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const { id } = await params

    if (!await canAccessStudent(session, id)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const date = searchParams.get("date")
    const recent = searchParams.get("recent") === "true"

    if (recent) {
      const logs = await prisma.dailyProgressLog.findMany({
        where: { studentId: id },
        orderBy: { date: "desc" },
        take: 7,
        include: {
          createdBy: { select: { fullName: true } },
        },
      })
      return NextResponse.json({ logs })
    }

    if (date) {
      const log = await prisma.dailyProgressLog.findUnique({
        where: { studentId_date: { studentId: id, date: new Date(date + "T00:00:00Z") } },
        include: {
          createdBy: { select: { fullName: true } },
        },
      })
      return NextResponse.json({ log })
    }

    return NextResponse.json({ error: "Paramètre date ou requis manquant" }, { status: 400 })
  } catch (error: any) {
    console.error("[DAILY LOG GET]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user || !["ADMIN", "TEACHER", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    if (!await canAccessStudent(session, id)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const body = await req.json()
    const parsed = LogSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data
    const dateObj = new Date(data.date + "T00:00:00Z")

    const existing = await prisma.dailyProgressLog.findUnique({
      where: { studentId_date: { studentId: id, date: dateObj } },
    })
    if (existing) {
      return NextResponse.json({ error: "Un log existe déjà pour cette date. Utilisez PATCH." }, { status: 409 })
    }

    const log = await prisma.dailyProgressLog.create({
      data: {
        studentId: id,
        date: dateObj,
        createdById: session.user.id,
        hifzFromSurahId: data.hifzFromSurahId ?? null,
        hifzFromVerse: data.hifzFromVerse ?? null,
        hifzToSurahId: data.hifzToSurahId ?? null,
        hifzToVerse: data.hifzToVerse ?? null,
        hifzNote: data.hifzNote ?? null,
        murajaFromSurahId: data.murajaFromSurahId ?? null,
        murajaFromVerse: data.murajaFromVerse ?? null,
        murajaToSurahId: data.murajaToSurahId ?? null,
        murajaToVerse: data.murajaToVerse ?? null,
        murajaNote: data.murajaNote ?? null,
        talqinFromSurahId: data.talqinFromSurahId ?? null,
        talqinFromVerse: data.talqinFromVerse ?? null,
        talqinToSurahId: data.talqinToSurahId ?? null,
        talqinToVerse: data.talqinToVerse ?? null,
        talqinNote: data.talqinNote ?? null,
        courseBook: data.courseBook ?? null,
        courseFromPage: data.courseFromPage ?? null,
        courseToPage: data.courseToPage ?? null,
        courseNote: data.courseNote ?? null,
        attendanceStatus: data.attendanceStatus ?? null,
        teacherObservation: data.teacherObservation ?? null,
        parentObservation: data.parentObservation ?? null,
        globalScore: data.globalScore ?? null,
      },
    })

    // Notify parents
    const parentLinks = await prisma.parentStudentLink.findMany({
      where: { studentId: id, isVerified: true },
      include: { parent: { include: { user: { select: { id: true, schoolId: true } } } } },
    })
    const student = await prisma.student.findUnique({
      where: { id },
      select: { user: { select: { fullName: true, schoolId: true } } },
    })
    if (student && parentLinks.length > 0) {
      const parentUserIds = parentLinks.map((link) => link.parent.user.id)
      const parentUsers = await prisma.user.findMany({
        where: { id: { in: parentUserIds } },
        select: { id: true, evaluationNotifications: true },
      })
      const enabledParents = parentUsers.filter(u => u.evaluationNotifications !== false)
      if (enabledParents.length > 0) {
        await prisma.notification.createMany({
          data: enabledParents.map((u) => ({
            schoolId: student.user.schoolId,
            userId: u.id,
            type: "DAILY_LOG_UPDATED",
            title: `Carnet du jour : ${student.user.fullName}`,
            titleAr: `سجل اليوم: ${student.user.fullName}`,
            message: `Le carnet de suivi du ${data.date} a été rempli par l'enseignant.`,
            messageAr: `تم ملء سجل المتابعة بتاريخ ${data.date} من قبل المعلم.`,
            data: { logId: log.id, studentId: id, date: data.date, url: "/parent/dashboard" },
          })),
        })
      }
    }

    return NextResponse.json({ log }, { status: 201 })
  } catch (error: any) {
    console.error("[DAILY LOG POST]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user || !["ADMIN", "TEACHER", "SUPERADMIN", "PARENT"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    if (!await canAccessStudent(session, id)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const body = await req.json()
    const parsed = LogSchema.partial().safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data
    if (!data.date) {
      return NextResponse.json({ error: "Date requise" }, { status: 400 })
    }

    const dateObj = new Date(data.date + "T00:00:00Z")

    const existing = await prisma.dailyProgressLog.findUnique({
      where: { studentId_date: { studentId: id, date: dateObj } },
    })
    if (!existing) {
      return NextResponse.json({ error: "Log introuvable pour cette date" }, { status: 404 })
    }

    // Parents can only update parentObservation
    const isParent = session.user.role === "PARENT"
    const updateData: any = isParent
      ? { parentObservation: data.parentObservation }
      : {
          hifzFromSurahId: data.hifzFromSurahId ?? existing.hifzFromSurahId,
          hifzFromVerse: data.hifzFromVerse ?? existing.hifzFromVerse,
          hifzToSurahId: data.hifzToSurahId ?? existing.hifzToSurahId,
          hifzToVerse: data.hifzToVerse ?? existing.hifzToVerse,
          hifzNote: data.hifzNote ?? existing.hifzNote,
          murajaFromSurahId: data.murajaFromSurahId ?? existing.murajaFromSurahId,
          murajaFromVerse: data.murajaFromVerse ?? existing.murajaFromVerse,
          murajaToSurahId: data.murajaToSurahId ?? existing.murajaToSurahId,
          murajaToVerse: data.murajaToVerse ?? existing.murajaToVerse,
          murajaNote: data.murajaNote ?? existing.murajaNote,
          talqinFromSurahId: data.talqinFromSurahId ?? existing.talqinFromSurahId,
          talqinFromVerse: data.talqinFromVerse ?? existing.talqinFromVerse,
          talqinToSurahId: data.talqinToSurahId ?? existing.talqinToSurahId,
          talqinToVerse: data.talqinToVerse ?? existing.talqinToVerse,
          talqinNote: data.talqinNote ?? existing.talqinNote,
          courseBook: data.courseBook ?? existing.courseBook,
          courseFromPage: data.courseFromPage ?? existing.courseFromPage,
          courseToPage: data.courseToPage ?? existing.courseToPage,
          courseNote: data.courseNote ?? existing.courseNote,
          attendanceStatus: data.attendanceStatus ?? existing.attendanceStatus,
          teacherObservation: data.teacherObservation ?? existing.teacherObservation,
          parentObservation: data.parentObservation ?? existing.parentObservation,
          globalScore: data.globalScore ?? existing.globalScore,
        }

    const log = await prisma.dailyProgressLog.update({
      where: { id: existing.id },
      data: updateData,
    })

    // Notify parents on teacher update
    if (!isParent) {
      const parentLinks = await prisma.parentStudentLink.findMany({
        where: { studentId: id, isVerified: true },
        include: { parent: { include: { user: { select: { id: true, schoolId: true } } } } },
      })
      const student = await prisma.student.findUnique({
        where: { id },
        select: { user: { select: { fullName: true, schoolId: true } } },
      })
      if (student && parentLinks.length > 0) {
        const parentUserIds = parentLinks.map((link) => link.parent.user.id)
        const parentUsers = await prisma.user.findMany({
          where: { id: { in: parentUserIds } },
          select: { id: true, evaluationNotifications: true },
        })
        const enabledParents = parentUsers.filter(u => u.evaluationNotifications !== false)
        if (enabledParents.length > 0) {
          await prisma.notification.createMany({
            data: enabledParents.map((u) => ({
              schoolId: student.user.schoolId,
              userId: u.id,
              type: "DAILY_LOG_UPDATED",
              title: `Carnet mis à jour : ${student.user.fullName}`,
              titleAr: `سجل محدث: ${student.user.fullName}`,
              message: `Le carnet de suivi du ${data.date} a été mis à jour par l'enseignant.`,
              messageAr: `تم تحديث سجل المتابعة بتاريخ ${data.date} من قبل المعلم.`,
              data: { logId: log.id, studentId: id, date: data.date, url: "/parent/dashboard" },
            })),
          })
        }
      }
    }

    return NextResponse.json({ log })
  } catch (error: any) {
    console.error("[DAILY LOG PATCH]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}
