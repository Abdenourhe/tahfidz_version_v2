// src/app/api/memorization/assign/route.ts
// POST: Teacher assigns a Surah to a student
// GET: List assignments for the connected teacher

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const AssignSchema = z.object({
  studentId: z.string().min(1).optional(),
  studentIds: z.array(z.string().min(1)).optional(),
  surahId:   z.number().int().min(1).max(114),
  versesFrom: z.number().int().min(1).optional(),
  versesTo:   z.number().int().min(1).optional(),
  dueDate:    z.string().datetime().optional().nullable(),
  groupDueDates: z.record(z.string().datetime()).optional().nullable(),
  notes:      z.string().max(500).optional().nullable(),
}).refine((data) => data.studentId || (data.studentIds && data.studentIds.length > 0), {
  message: "studentId ou studentIds requis",
  path: ["studentId"],
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

    const { studentId, studentIds, surahId, versesFrom, versesTo, dueDate, groupDueDates, notes } = parsed.data

    const surah = await prisma.surah.findUnique({ where: { id: surahId } })
    if (!surah) {
      return NextResponse.json({ error: "Sourah introuvable" }, { status: 404 })
    }

    const fromVerse = versesFrom ?? 1
    const toVerse = versesTo ?? surah.verseCount
    if (fromVerse > toVerse) {
      return NextResponse.json({ error: "Le verset début doit être inférieur ou égal au verset fin" }, { status: 400 })
    }
    if (toVerse > surah.verseCount) {
      return NextResponse.json({ error: `La sourah ${surah.nameFr} contient ${surah.verseCount} versets` }, { status: 400 })
    }

    const targetStudentIds = studentIds && studentIds.length > 0 ? studentIds : [studentId!]

    // Verify all students belong to teacher
    const students = await prisma.student.findMany({
      where: { id: { in: targetStudentIds }, teacherId: teacher.id },
      include: { user: { select: { id: true, schoolId: true, fullName: true } } },
    })

    const studentGroupIds = new Set(students.map((s) => s.groupId).filter(Boolean))
    if (students.length !== targetStudentIds.length) {
      return NextResponse.json({ error: "Un ou plusieurs élèves non trouvés" }, { status: 404 })
    }

    if (groupDueDates) {
      const missingGroup = Array.from(studentGroupIds).find((gid) => !groupDueDates[gid as string])
      if (missingGroup) {
        return NextResponse.json({ error: `Date butoir manquante pour le groupe ${missingGroup}` }, { status: 400 })
      }
    }

    const assignments = await prisma.$transaction(
      students.map((student) => {
        const studentDueDate = groupDueDates && student.groupId && groupDueDates[student.groupId]
          ? new Date(groupDueDates[student.groupId])
          : dueDate ? new Date(dueDate) : null
        return prisma.memorizationProgress.create({
          data: {
            studentId: student.id,
            teacherId: teacher.id,
            surahId,
            startVerse: fromVerse,
            endVerse: toVerse,
            versesFrom: fromVerse,
            versesTo: toVerse,
            dueDate: studentDueDate,
            targetDate: studentDueDate,
            notes: notes ?? null,
            status: "ASSIGNED",
          },
          include: {
            student: { include: { user: { select: { fullName: true, id: true } } } },
            surah: { select: { nameFr: true, nameAr: true, verseCount: true } },
          },
        })
      })
    )

    // Notify students and parents
    for (const student of students) {
      const studentPrefs = await prisma.user.findUnique({
        where: { id: student.userId },
        select: { evaluationNotifications: true },
      })
      if (studentPrefs?.evaluationNotifications !== false) {
        await prisma.notification.create({
          data: {
            schoolId: student.user.schoolId,
            userId: student.userId,
            type: "MEMORIZATION_ASSIGNED",
            title: "Nouvelle sourah assignée",
            titleAr: "سورة جديدة معينة",
            message: `Vous devez mémoriser ${surah.nameFr} (versets ${fromVerse}-${toVerse})`,
            messageAr: `يجب عليك حفظ ${surah.nameAr} (آيات ${fromVerse}-${toVerse})`,
            data: { assignmentId: assignments.find(a => a.studentId === student.id)?.id, surahId, url: "/student/progress" },
          },
        })
      }

      const parentLinks = await prisma.parentStudentLink.findMany({
        where: { studentId: student.id, isVerified: true },
        include: { parent: { include: { user: { select: { id: true, schoolId: true } } } } },
      })
      if (parentLinks.length > 0) {
        const parentUserIds = parentLinks.map((link) => link.parent.userId)
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
              type: "MEMORIZATION_ASSIGNED_PARENT",
              title: `Nouvelle sourah pour ${student.user.fullName}`,
              titleAr: `سورة جديدة لـ ${student.user.fullName}`,
              message: `${student.user.fullName} doit mémoriser ${surah.nameFr}`,
              messageAr: `يجب على ${student.user.fullName} حفظ ${surah.nameAr}`,
              data: { assignmentId: assignments.find(a => a.studentId === student.id)?.id, surahId, studentId: student.id, url: "/parent/dashboard" },
            })),
          })
        }
      }
    }

    return NextResponse.json({ message: "Assignation créée", count: assignments.length, assignments }, { status: 201 })
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
