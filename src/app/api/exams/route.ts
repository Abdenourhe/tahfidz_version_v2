// src/app/api/exams/route.ts — FIXED: always finds teacherId
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const examSchema = z.object({
  title:       z.string().min(2, "Titre requis"),
  titleAr:     z.string().optional(),
  description: z.string().optional(),
  groupId:     z.string().min(1, "Groupe requis"),
  examDate:    z.string().min(1, "Date requise"),
  duration:    z.number().int().min(10).max(240).default(60),
})

export async function GET(_req: Request) {
  const session = await auth()
  if (!session?.user || !["ADMIN","TEACHER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const teacher = session.user.role === "TEACHER"
    ? await prisma.teacher.findUnique({ where: { userId: session.user.id } })
    : null

  const exams = await prisma.exam.findMany({
    where: teacher ? { teacherId: teacher.id } : {},
    include: {
      group:   { select: { name: true } },
      teacher: { include: { user: { select: { fullName: true } } } },
    },
    orderBy: { examDate: "asc" },
  })

  return NextResponse.json({ exams })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || !["ADMIN","TEACHER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 })
  }

  const parsed = examSchema.safeParse(body)
  if (!parsed.success) {
    const errors = Object.entries(parsed.error.flatten().fieldErrors)
      .map(([k, v]) => `${k}: ${v?.join(", ")}`)
      .join("; ")
    return NextResponse.json({ error: errors || "Données invalides" }, { status: 400 })
  }

  const { title, titleAr, description, groupId, examDate, duration } = parsed.data

  // Find teacherId: teacher profile → or group's teacher
  let teacherId: string | null = null

  const teacherProfile = await prisma.teacher.findUnique({ where: { userId: session.user.id } })
  if (teacherProfile) {
    teacherId = teacherProfile.id
  } else {
    // Admin: get the group's teacher
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { teacherId: true },
    })
    teacherId = group?.teacherId ?? null
  }

  if (!teacherId) {
    return NextResponse.json({ error: "Ce groupe n'a pas d'enseignant assigné. Veuillez assigner un enseignant au groupe d'abord." }, { status: 400 })
  }

  // Validate group exists
  const groupExists = await prisma.group.findUnique({ where: { id: groupId } })
  if (!groupExists) {
    return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 })
  }

  let examDateObj: Date
  try {
    examDateObj = new Date(examDate)
    if (isNaN(examDateObj.getTime())) throw new Error("Date invalide")
  } catch {
    return NextResponse.json({ error: "Format de date invalide" }, { status: 400 })
  }

  const exam = await (prisma.exam as any).create({
    data: {
      title,
      titleAr:     titleAr || null,
      description: description || null,
      groupId,
      teacherId,
      examDate:    examDateObj,
      duration,
      surahIds:    [],
    },
    include: {
      group:   { select: { name: true } },
      teacher: { include: { user: { select: { fullName: true } } } },
    },
  })

  // Notify all students in group + their parents
  const students = await prisma.student.findMany({
    where: { groupId },
    include: {
      user: { select: { id: true } },
      parentLinks: {
        where: { isVerified: true },
        include: { parent: { include: { user: { select: { id: true } } } } },
      },
    },
  })

  const examDateStr = examDateObj.toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
  })

  const recipientMap = new Map<string, "STUDENT" | "PARENT">()
  students.forEach(s => {
    recipientMap.set(s.user.id, "STUDENT")
    s.parentLinks.forEach(l => recipientMap.set(l.parent.user.id, "PARENT"))
  })
  const recipientIds = Array.from(recipientMap.keys())

  if (recipientIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: recipientIds } },
      select: { id: true, evaluationNotifications: true },
    })
    const allowedIds = new Set(users.filter(u => u.evaluationNotifications !== false).map(u => u.id))

    const notifications = recipientIds
      .filter(id => allowedIds.has(id))
      .map(userId => ({
        userId,
        schoolId: session.user.schoolId,
        type:    "exam" as const,
        title:   `📝 Examen prévu : ${title}`,
        titleAr: titleAr ? `📝 اختبار قادم : ${titleAr}` : undefined,
        message: `Un examen est prévu le ${examDateStr}. Durée : ${duration} minutes.${description ? "\n" + description : ""}`,
        data: { url: recipientMap.get(userId) === "STUDENT" ? "/student/dashboard" : "/parent/dashboard", examId: exam.id },
      }))

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications })
    }
  }

  return NextResponse.json({ exam }, { status: 201 })
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user || !["ADMIN","TEACHER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 })

  await prisma.exam.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
