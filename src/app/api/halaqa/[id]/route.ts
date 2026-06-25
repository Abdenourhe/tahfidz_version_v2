// src/app/api/halaqa/[id]/route.ts
// GET détail + PATCH édition d'une session Halaqa (SCHEDULED uniquement)

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { checkHalaqaCreationAllowed } from "@/lib/halaqa-quota"
import { notifyHalaqaParticipants } from "@/lib/halaqa-notifications"
import { NextResponse } from "next/server"
import { z } from "zod"

const updateSchema = z.object({
  meetingName: z.string().min(2).optional(),
  studentIds: z.array(z.string()).min(1).optional(),
  groupId: z.string().optional().nullable(),
  scheduledAt: z.string().datetime().optional(),
  type: z.enum(["INDIVIDUAL", "COLLECTIVE"]).optional(),
  mode: z.enum(["AUDIO_ONLY", "VIDEO", "SCREEN_SHARE"]).optional(),
  sourah: z.string().optional().nullable(),
  verses: z.string().optional().nullable(),
  duration: z.number().min(15).max(180).optional(),
  teacherId: z.string().optional(),
  invitedGroupIds: z.array(z.string()).optional(),
})

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { schoolId, id: userId, role } = session.user
    const { id } = await params

    const halaqa = await prisma.halaqaSession.findFirst({
      where: { id, schoolId },
      include: {
        teacher: { select: { id: true, fullName: true, email: true } },
        group: { select: { id: true, name: true } },
        invitedGroups: {
          include: {
            group: { select: { id: true, name: true } },
          },
        },
        evaluations: {
          include: { student: { select: { id: true, fullName: true } } },
        },
      },
    })

    if (!halaqa) {
      return NextResponse.json({ error: "Session non trouvée" }, { status: 404 })
    }

    const isTeacher = halaqa.teacherId === userId
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(role)
    if (!isTeacher && !isAdmin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    return NextResponse.json({ session: halaqa }, { status: 200 })
  } catch (error: any) {
    console.error("[HALAQA GET ERROR]", error?.message || String(error))
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { schoolId, id: userId, role } = session.user
    const { id } = await params

    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data

    const existing = await prisma.halaqaSession.findFirst({
      where: { id, schoolId },
      include: { teacher: { select: { id: true, fullName: true } } },
    })

    if (!existing) {
      return NextResponse.json({ error: "Session non trouvée" }, { status: 404 })
    }

    const isTeacher = existing.teacherId === userId
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(role)
    if (!isTeacher && !isAdmin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    if (existing.status !== "SCHEDULED") {
      return NextResponse.json(
        { error: "Seules les séances planifiées peuvent être modifiées" },
        { status: 400 }
      )
    }

    // ─── Validation de la durée ───────────────────────────────────────
    const requestedDuration = data.duration ?? existing.duration ?? undefined
    const quotaCheck = await checkHalaqaCreationAllowed(schoolId, requestedDuration)
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        { error: quotaCheck.reason, quota: quotaCheck.status },
        { status: 403 }
      )
    }

    // ─── Validation de l'enseignant assigné ────────────────────────────
    let finalTeacherId = existing.teacherId
    if (data.teacherId) {
      if (!isAdmin) {
        return NextResponse.json({ error: "Non autorisé à réassigner la séance" }, { status: 403 })
      }
      const assignedTeacher = await prisma.user.findFirst({
        where: { id: data.teacherId, schoolId, role: "TEACHER", isActive: true },
        select: { id: true },
      })
      if (!assignedTeacher) {
        return NextResponse.json({ error: "Enseignant invalide ou inactif" }, { status: 400 })
      }
      finalTeacherId = assignedTeacher.id
    }

    // ─── Validation des élèves ────────────────────────────────────────
    const finalStudentIds = data.studentIds ?? existing.studentIds
    if (data.studentIds) {
      const validStudents = await prisma.user.findMany({
        where: {
          id: { in: finalStudentIds },
          schoolId,
          role: "STUDENT",
          isActive: true,
        },
        select: { id: true },
      })
      const validStudentIds = validStudents.map((s) => s.id)
      const invalidStudentIds = finalStudentIds.filter((sid) => !validStudentIds.includes(sid))
      if (invalidStudentIds.length > 0) {
        return NextResponse.json(
          { error: "Certains élèves sont invalides", invalidStudentIds },
          { status: 400 }
        )
      }
    }

    // ─── Mise à jour des groupes invités ──────────────────────────────
    if (data.invitedGroupIds !== undefined) {
      if (!isAdmin) {
        return NextResponse.json({ error: "Non autorisé à modifier les groupes invités" }, { status: 403 })
      }

      const newGroupIds = data.invitedGroupIds
      if (data.groupId && newGroupIds.includes(data.groupId)) {
        return NextResponse.json({ error: "Le groupe principal ne peut pas être invité" }, { status: 400 })
      }

      const invitedGroups = await prisma.group.findMany({
        where: {
          id: { in: newGroupIds },
          schoolId,
          isActive: true,
        },
        select: { id: true },
      })

      if (invitedGroups.length !== newGroupIds.length) {
        return NextResponse.json({ error: "Certains groupes invités sont invalides" }, { status: 400 })
      }

      await prisma.halaqaSessionGroup.deleteMany({ where: { halaqaSessionId: id } })
      if (newGroupIds.length > 0) {
        await prisma.halaqaSessionGroup.createMany({
          data: newGroupIds.map((groupId) => ({ halaqaSessionId: id, groupId })),
          skipDuplicates: true,
        })
      }
    }

    // ─── Mise à jour Prisma uniquement (BBB non modifié) ──────────────
    const updated = await prisma.halaqaSession.update({
      where: { id },
      data: {
        meetingName: data.meetingName,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        duration: data.duration,
        type: data.type,
        mode: data.mode,
        sourah: data.sourah === null ? null : data.sourah === undefined ? undefined : data.sourah,
        verses: data.verses === null ? null : data.verses === undefined ? undefined : data.verses,
        studentIds: data.studentIds,
        groupId: data.groupId === null ? null : data.groupId === undefined ? undefined : data.groupId,
        teacherId: finalTeacherId,
      },
      include: {
        teacher: { select: { id: true, fullName: true, email: true } },
        group: { select: { id: true, name: true } },
        invitedGroups: {
          include: {
            group: { select: { id: true, name: true } },
          },
        },
      },
    })

    // Notifier les participants du changement
    await notifyHalaqaParticipants(updated, "halaqa_updated", [userId])

    return NextResponse.json({ session: updated }, { status: 200 })
  } catch (error: any) {
    console.error("[HALAQA PATCH ERROR]", error?.message || String(error))
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
