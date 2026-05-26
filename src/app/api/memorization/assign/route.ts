// src/app/api/memorization/assign/route.ts
// POST: Teacher assigns a Surah to a student
// GET: List assignments for the connected teacher

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const AssignSchema = z.object({
  studentId: z.string().min(1),
  surahId:   z.number().int().min(1).max(114),
  versesFrom: z.number().int().min(1).optional(),
  versesTo:   z.number().int().min(1).optional(),
  dueDate:    z.string().datetime().optional().nullable(),
  notes:      z.string().max(500).optional().nullable(),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!teacher) {
      return NextResponse.json({ error: "Professeur introuvable" }, { status: 404 })
    }

    const body = await req.json()
    const parsed = AssignSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { studentId, surahId, versesFrom, versesTo, dueDate, notes } = parsed.data

    // Verify student belongs to teacher's school
    const student = await prisma.student.findFirst({
      where: { id: studentId, teacherId: teacher.id },
      include: { user: { select: { schoolId: true, fullName: true } } },
    })
    if (!student) {
      return NextResponse.json({ error: "Élève non trouvé" }, { status: 404 })
    }

    const surah = await prisma.surah.findUnique({ where: { id: surahId } })
    if (!surah) {
      return NextResponse.json({ error: "Sourah introuvable" }, { status: 404 })
    }

    const assignment = await prisma.memorizationProgress.create({
      data: {
        studentId,
        teacherId: teacher.id,
        surahId,
        startVerse: versesFrom ?? 1,
        endVerse: versesTo ?? surah.verseCount,
        versesFrom: versesFrom ?? 1,
        versesTo: versesTo ?? surah.verseCount,
        dueDate: dueDate ? new Date(dueDate) : null,
        targetDate: dueDate ? new Date(dueDate) : null,
        notes: notes ?? null,
        status: "ASSIGNED",
      },
      include: {
        student: { include: { user: { select: { fullName: true, id: true } } } },
        surah: { select: { nameFr: true, nameAr: true, verseCount: true } },
      },
    })

    // Notify student
    await prisma.notification.create({
      data: {
        schoolId: student.user.schoolId,
        userId: student.userId,
        type: "MEMORIZATION_ASSIGNED",
        title: "Nouvelle sourah assignée",
        titleAr: "سورة جديدة معينة",
        message: `Vous devez mémoriser ${surah.nameFr} (versets ${versesFrom ?? 1}-${versesTo ?? surah.verseCount})`,
        messageAr: `يجب عليك حفظ ${surah.nameAr} (آيات ${versesFrom ?? 1}-${versesTo ?? surah.verseCount})`,
        data: { assignmentId: assignment.id, surahId },
      },
    })

    // Notify linked parents
    const parentLinks = await prisma.parentStudentLink.findMany({
      where: { studentId, isVerified: true },
      include: { parent: { include: { user: { select: { id: true, schoolId: true } } } } },
    })

    if (parentLinks.length > 0) {
      await prisma.notification.createMany({
        data: parentLinks.map((link) => ({
          schoolId: link.parent.user.schoolId,
          userId: link.parent.userId,
          type: "MEMORIZATION_ASSIGNED_PARENT",
          title: `Nouvelle sourah pour ${student.user.fullName}`,
          titleAr: `سورة جديدة لـ ${student.user.fullName}`,
          message: `${student.user.fullName} doit mémoriser ${surah.nameFr}`,
          messageAr: `يجب على ${student.user.fullName} حفظ ${surah.nameAr}`,
          data: { assignmentId: assignment.id, surahId, studentId },
        })),
      })
    }

    return NextResponse.json({ message: "Assignation créée", assignment }, { status: 201 })
  } catch (error: any) {
    console.error("[MEMORIZATION ASSIGN]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 })

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!teacher) return NextResponse.json({ error: "Professeur introuvable" }, { status: 404 })

    const existing = await prisma.memorizationProgress.findFirst({
      where: { id, teacherId: teacher.id },
    })
    if (!existing) return NextResponse.json({ error: "Assignation introuvable" }, { status: 404 })

    await prisma.$transaction([
      prisma.statusHistory.deleteMany({ where: { progressId: id } }),
      prisma.evaluation.deleteMany({ where: { progressId: id } }),
      prisma.memorizationProgress.delete({ where: { id } }),
    ])

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[MEMORIZATION DELETE]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const role = session.user.role
    let where: Record<string, unknown> = {}

    if (role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })
      if (!teacher) return NextResponse.json({ assignments: [] })
      where = { teacherId: teacher.id }
    } else if (role === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })
      if (!student) return NextResponse.json({ assignments: [] })
      where = { studentId: student.id }
    } else if (role === "PARENT") {
      const parent = await prisma.parent.findUnique({
        where: { userId: session.user.id },
        include: { childrenLinks: { where: { isVerified: true }, select: { studentId: true } } },
      })
      if (!parent) return NextResponse.json({ assignments: [] })
      const childIds = parent.childrenLinks.map(l => l.studentId)
      where = { studentId: { in: childIds } }
    } else if (role === "ADMIN" || role === "SUPERADMIN") {
      // Admin voit tout pour son école
      where = { student: { user: { schoolId: session.user.schoolId } } }
    } else {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const assignments = await prisma.memorizationProgress.findMany({
      where,
      include: {
        student: { include: { user: { select: { fullName: true, fullNameAr: true } } } },
        surah: { select: { id: true, nameFr: true, nameAr: true, verseCount: true } },
        statusHistory: { orderBy: { changedAt: "desc" }, take: 1 },
      },
      orderBy: { startedAt: "desc" },
    })

    return NextResponse.json({ assignments })
  } catch (error: any) {
    console.error("[MEMORIZATION LIST]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}
