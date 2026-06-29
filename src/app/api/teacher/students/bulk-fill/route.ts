// src/app/api/teacher/students/bulk-fill/route.ts
// Pré-remplit une section du carnet pour tous les élèves visibles

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

const VALID_SECTIONS = ["ATTENDANCE", "HIFZ", "MURAJA", "TALQIN", "COURSE", "GLOBAL_SCORE"] as const
type Section = typeof VALID_SECTIONS[number]

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || !["ADMIN", "TEACHER", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const body = await req.json()
    const { date, section, value, groupId, note } = body as {
      date: string
      section: Section
      value: Record<string, unknown>
      groupId?: string
      note?: string
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Paramètre date requis (YYYY-MM-DD)" }, { status: 400 })
    }
    if (!groupId) {
      return NextResponse.json({ error: "Paramètre groupId requis" }, { status: 400 })
    }
    if (!VALID_SECTIONS.includes(section)) {
      return NextResponse.json({ error: "Section invalide" }, { status: 400 })
    }
    if (!value || typeof value !== "object") {
      return NextResponse.json({ error: "Valeur invalide" }, { status: 400 })
    }

    const dateObj = new Date(date + "T00:00:00Z")
    const schoolId = session.user.schoolId

    let teacherId: string | undefined
    if (session.user.role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })
      if (!teacher) return NextResponse.json({ error: "Profil enseignant introuvable" }, { status: 404 })
      teacherId = teacher.id
    }

    // Groupes accessibles
    const groups = await prisma.group.findMany({
      where: { schoolId, ...(teacherId ? { teacherId } : {}) },
      select: { id: true },
    })
    const groupIds = groups.map((g) => g.id)

    // Vérifie que le groupe sélectionné est accessible
    if (groupId && !groupIds.includes(groupId)) {
      return NextResponse.json({ error: "Groupe non accessible" }, { status: 403 })
    }

    // Élèves filtrés
    const where: Record<string, unknown> = {
      user: { schoolId, isActive: true },
      ...(teacherId ? { teacherId } : {}),
      ...(groupId ? { groupId } : groupIds.length ? { groupId: { in: groupIds } } : {}),
    }

    const students = await prisma.student.findMany({
      where,
      select: { id: true, groupId: true, dailyLogs: { where: { date: dateObj }, take: 1 } },
    })

    if (students.length === 0) {
      return NextResponse.json({ count: 0 })
    }

    // Construit les données avec la note optionnelle
    const data: Record<string, unknown> = { ...value, date: dateObj }
    if (note?.trim()) {
      if (section === "HIFZ") data.hifzNote = note.trim()
      else if (section === "MURAJA") data.murajaNote = note.trim()
      else if (section === "TALQIN") data.talqinNote = note.trim()
      else if (section === "COURSE") data.courseNote = note.trim()
      else if (section === "ATTENDANCE") data.teacherObservation = note.trim()
    }

    // Upsert des daily logs + synchronisation Attendance dans une seule transaction
    const operations: Prisma.PrismaPromise<unknown>[] = students.map((student) => {
      const existing = student.dailyLogs[0]
      if (existing) {
        return prisma.dailyProgressLog.update({
          where: { id: existing.id },
          data,
        })
      }
      return prisma.dailyProgressLog.create({
        data: { ...data, studentId: student.id, createdById: session.user.id, date: dateObj },
      })
    })

    if (section === "ATTENDANCE" && value.attendanceStatus) {
      const status = value.attendanceStatus as "PRESENT" | "ABSENT" | "LATE" | "EXCUSED"
      students.forEach((student) => {
        if (!student.groupId) return
        operations.push(
          prisma.attendance.upsert({
            where: { studentId_date: { studentId: student.id, date: dateObj } },
            update: { status, recordedBy: session.user.id },
            create: {
              studentId: student.id,
              groupId: student.groupId,
              date: dateObj,
              status,
              recordedBy: session.user.id,
              notes: null,
            },
          })
        )
      })
    }

    await prisma.$transaction(operations)

    return NextResponse.json({ count: students.length })
  } catch (error: any) {
    console.error("[TEACHER ELEVES BULK FILL]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}
