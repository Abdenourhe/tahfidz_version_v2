// src/app/api/students/[id]/route.ts
// GET | PATCH (update général + ?action=toggle + ?action=transfer) | DELETE
// Fusion de : [id]/route.ts + toggle/route.ts + transfer/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string }> }

// ═════════════════════════════════════════════════════════════════════════════
// GET — Récupérer un élève
// ═════════════════════════════════════════════════════════════════════════════
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const { id } = await params

    const student = await prisma.student.findUnique({
      where: { id },
      select: {
        id: true,
        emergencyPhone: true,
        dateOfBirth: true,
        address: true,
        city: true,
        postalCode: true,
        medicalNotes: true,
        currentSurahNote: true,
        nationality: true,
        spokenLanguages: true,
        totalStars: true,
        currentStreak: true,
        groupId: true,
        teacherId: true,
        user: {
          select: {
            id: true, fullName: true, fullNameAr: true, email: true,
            phone: true, gender: true, avatar: true, isActive: true, createdAt: true, schoolId: true,
          },
        },
        group:   { select: { id: true, name: true, level: true } },
        teacher: { include: { user: { select: { id: true, fullName: true, phone: true, email: true } } } },
        studentGroups: {
          include: { group: { select: { id: true, name: true, level: true } } },
          orderBy: { createdAt: "asc" },
        },
        parentLinks: {
          include: { parent: { include: { user: { select: { fullName: true, phone: true, email: true } } } } },
          where: { isVerified: true },
        },
        _count: { select: { memorizedSurahs: true } },
        memorizationProgress: {
          include: {
            surah: true,
            evaluation: { select: { finalScore: true, decision: true } },
            statusHistory: { orderBy: { changedAt: "desc" }, take: 2 },
          },
          orderBy: { updatedAt: "desc" },
        },
        attendances: { orderBy: { date: "desc" }, take: 14, select: { date: true, status: true } },
        studentBadges: { include: { badge: { select: { icon: true, name: true, rarity: true } } }, orderBy: { earnedAt: "desc" } },
      },
    })

    if (!student) return NextResponse.json({ error: "Élève non trouvé" }, { status: 404 })

    const teacher = session.user.role === "TEACHER"
      ? await prisma.teacher.findUnique({ where: { userId: session.user.id }, select: { id: true } })
      : null

    const isAuthorized =
      session.user.role === "SUPERADMIN" ||
      (session.user.role === "ADMIN" && student.user.schoolId === session.user.schoolId) ||
      (session.user.role === "TEACHER" && student.teacherId === teacher?.id) ||
      (session.user.role === "PARENT" && student.parentLinks.some((l: any) => l.parent.userId === session.user.id))

    if (!isAuthorized) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    return NextResponse.json({ student })
  } catch (error: any) {
    console.error("[STUDENT GET ERROR]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// PATCH — Trois modes selon ?action=
//   • (défaut) : mise à jour des champs de l'élève
//   • ?action=toggle : activer/désactiver (remplace l'ancien /toggle)
//   • ?action=transfer : changer de groupe (remplace l'ancien /transfer)
// ═════════════════════════════════════════════════════════════════════════════
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPERADMIN", "TEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const { id } = await params
    const action  = new URL(req.url).searchParams.get("action")
    const schoolId = session.user.schoolId

    // ── ACTION : toggle ─────────────────────────────────────────────────
    if (action === "toggle") {
      if (!["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
      }

      const student = await prisma.student.findFirst({
        where: { id, user: { schoolId } },
        include: { user: true },
      })
      if (!student) return NextResponse.json({ error: "Élève introuvable" }, { status: 404 })

      const newStatus = !student.user.isActive
      await prisma.user.update({ where: { id: student.userId }, data: { isActive: newStatus } })

      await prisma.auditLog.create({
        data: {
          schoolId, userId: session.user.id,
          action: newStatus ? "ACTIVATE_STUDENT" : "DEACTIVATE_STUDENT",
          actorId: session.user.id, actorRole: session.user.role,
          actorEmail: session.user.email || "admin@system.local",
          actorName: session.user.name || session.user.email || "Administrateur",
          entityType: "student", entityId: id,
          targetType: "student", targetId: id, targetName: student.user.fullName,
          newValues: { isActive: newStatus },
        },
      })

      return NextResponse.json({
        success: true,
        message: newStatus ? "Élève activé" : "Élève désactivé",
        isActive: newStatus,
      })
    }

    // ── ACTION : transfer ────────────────────────────────────────────────
    if (action === "transfer") {
      if (!["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
      }

      const { newGroupId, reason } = await req.json()
      if (!newGroupId) return NextResponse.json({ error: "Nouveau groupe requis" }, { status: 400 })

      const student = await prisma.student.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, fullName: true } },
          group: { select: { id: true, name: true } },
          teacher: { include: { user: { select: { id: true, fullName: true } } } },
          parentLinks: {
            where: { isVerified: true },
            include: { parent: { include: { user: { select: { id: true } } } } },
          },
        },
      })
      if (!student) return NextResponse.json({ error: "Élève introuvable" }, { status: 404 })

      const newGroup = await prisma.group.findUnique({
        where: { id: newGroupId, schoolId },
        include: { teacher: { include: { user: { select: { id: true, fullName: true } } } } },
      })
      if (!newGroup) return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 })

      const oldGroupName = student.group?.name ?? "aucun"

      await prisma.student.update({
        where: { id },
        data: { groupId: newGroupId, teacherId: newGroup.teacherId },
      })

      // Synchronise la table de liaison : retire l'ancien groupe principal, ajoute le nouveau
      if (student.groupId && student.groupId !== newGroupId) {
        await prisma.studentGroup.deleteMany({
          where: { studentId: id, groupId: student.groupId },
        })
      }
      await prisma.studentGroup.upsert({
        where: { studentId_groupId: { studentId: id, groupId: newGroupId } },
        update: {},
        create: { studentId: id, groupId: newGroupId },
      })

      await prisma.auditLog.create({
        data: {
          schoolId, userId: session.user.id, action: "TRANSFER_STUDENT",
          actorId: session.user.id, actorRole: session.user.role,
          actorEmail: session.user.email || "admin@system.local",
          actorName: session.user.name || session.user.email || "Administrateur",
          entityType: "student", entityId: id,
          targetType: "student", targetId: id, targetName: student.user.fullName,
          oldValues: { groupId: student.groupId, teacherId: student.teacherId },
          newValues: { groupId: newGroupId, teacherId: newGroup.teacherId, reason },
          details: reason || undefined,
        },
      })

      // Notifications aux parties concernées
      const notifBase = {
        type: "TRANSFER",
        title: `Transfert de groupe — ${student.user.fullName}`,
        titleAr: `نقل مجموعة — ${student.user.fullName}`,
        message: `${student.user.fullName} a été transféré de ${oldGroupName} vers ${newGroup.name}.${reason ? ` Raison : ${reason}` : ""}`,
        messageAr: `تم نقل ${student.user.fullName} من ${oldGroupName} إلى ${newGroup.name}.`,
        data: { studentId: id, oldGroupId: student.groupId, newGroupId },
      }

      const targets: string[] = [student.user.id]
      student.parentLinks.forEach((l: any) => targets.push(l.parent.user.id))
      if (student.teacher?.user?.id) targets.push(student.teacher.user.id)
      if (newGroup.teacher?.user?.id && newGroup.teacher.user.id !== student.teacher?.user?.id) {
        targets.push(newGroup.teacher.user.id)
      }

      const targetUsers = await prisma.user.findMany({
        where: { id: { in: targets } },
        select: { id: true, role: true, messageNotifications: true },
      })
      const enabledTargets = targetUsers.filter(u => u.messageNotifications !== false)

      if (enabledTargets.length > 0) {
        await prisma.notification.createMany({
          data: enabledTargets.map(u => ({
            userId: u.id,
            schoolId,
            ...notifBase,
            data: {
              ...notifBase.data,
              url: u.role === "STUDENT" ? "/student/dashboard" : u.role === "PARENT" ? "/parent/dashboard" : "/teacher/dashboard",
            },
          })),
        })
      }

      return NextResponse.json({ success: true, message: "Transfert effectué" })
    }

    // ── ACTION : mise à jour générale (défaut) ───────────────────────────
    const body = await req.json()
    const { email, phone, emergencyPhone, fullName, fullNameAr, gender,
            isActive, groupId, groupIds, teacherId, address, city, postalCode,
            medicalNotes, currentSurahNote, nationality, spokenLanguages, avatar } = body

    const existingStudent = await prisma.student.findUnique({ where: { id }, include: { user: true } })
    if (!existingStudent) return NextResponse.json({ error: "Élève non trouvé" }, { status: 404 })

    const teacher = session.user.role === "TEACHER"
      ? await prisma.teacher.findUnique({ where: { userId: session.user.id }, select: { id: true } })
      : null

    const isAuthorized =
      session.user.role === "SUPERADMIN" ||
      (session.user.role === "ADMIN" && session.user.schoolId === existingStudent.user.schoolId) ||
      (session.user.role === "TEACHER" && existingStudent.teacherId === teacher?.id)

    if (!isAuthorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 })

    // Normalise les groupes : `groupIds` prime sur `groupId` (compatibilité)
    const effectiveGroupIds: string[] | undefined = Array.isArray(groupIds)
      ? groupIds.filter((g): g is string => typeof g === "string" && g.length > 0)
      : groupId !== undefined
        ? groupId
          ? [groupId]
          : []
        : undefined

    const userUpdate: Record<string, unknown> = {}
    if (email !== undefined)     userUpdate.email     = email
    if (phone !== undefined)     userUpdate.phone     = phone
    if (fullName !== undefined)  userUpdate.fullName  = fullName
    if (fullNameAr !== undefined) userUpdate.fullNameAr = fullNameAr
    if (gender !== undefined)    userUpdate.gender    = gender
    if (isActive !== undefined)  userUpdate.isActive  = isActive
    if (avatar !== undefined)    userUpdate.avatar    = avatar

    const studentUpdate: Record<string, unknown> = {}
    if (emergencyPhone !== undefined) studentUpdate.emergencyPhone = emergencyPhone || null
    if (teacherId !== undefined) studentUpdate.teacherId = teacherId || null
    if (address !== undefined)   studentUpdate.address   = address || null
    if (city !== undefined)      studentUpdate.city      = city || null
    if (postalCode !== undefined) studentUpdate.postalCode = postalCode || null
    if (medicalNotes !== undefined) studentUpdate.medicalNotes = medicalNotes || null
    if (currentSurahNote !== undefined) studentUpdate.currentSurahNote = currentSurahNote || null
    if (nationality !== undefined) studentUpdate.nationality = nationality || null
    if (spokenLanguages !== undefined) studentUpdate.spokenLanguages = spokenLanguages || null

    if (effectiveGroupIds !== undefined) {
      studentUpdate.groupId = effectiveGroupIds[0] || null
    } else if (groupId !== undefined) {
      studentUpdate.groupId = groupId || null
    }

    const result = await prisma.$transaction(async (tx) => {
      if (Object.keys(userUpdate).length > 0) {
        await tx.user.update({ where: { id: existingStudent.userId }, data: userUpdate })
      }
      let updated = existingStudent as any
      if (Object.keys(studentUpdate).length > 0) {
        updated = await tx.student.update({
          where: { id },
          data: studentUpdate,
          include: { user: true, group: true, teacher: { include: { user: true } } },
        })
      }

      // Synchronise les groupes avec la table de liaison
      if (effectiveGroupIds !== undefined) {
        if (effectiveGroupIds.length > 0) {
          await tx.studentGroup.deleteMany({
            where: { studentId: id, groupId: { notIn: effectiveGroupIds } },
          })
          await tx.studentGroup.createMany({
            data: effectiveGroupIds.map((gid) => ({ studentId: id, groupId: gid })),
            skipDuplicates: true,
          })
        } else {
          await tx.studentGroup.deleteMany({ where: { studentId: id } })
        }
      } else if (groupId !== undefined && groupId) {
        // Compatibilité : ancien champ groupId unique
        await tx.studentGroup.upsert({
          where: { studentId_groupId: { studentId: id, groupId } },
          update: {},
          create: { studentId: id, groupId },
        })
      }

      return updated
    })

    return NextResponse.json({ message: "Élève mis à jour", student: result })
  } catch (error: any) {
    console.error("[STUDENT PATCH ERROR]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// DELETE — Supprimer un élève (cascade complète)
// ═════════════════════════════════════════════════════════════════════════════
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const { id } = await params

    const student = await prisma.student.findUnique({
      where: { id },
      include: { user: { select: { id: true, schoolId: true } } },
    })
    if (!student) return NextResponse.json({ error: "Élève non trouvé" }, { status: 404 })

    if (session.user.role === "ADMIN" && session.user.schoolId !== student.user.schoolId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    // ✅ CORRIGÉ : Timeout augmenté à 10000ms pour éviter l'erreur transaction
    await prisma.$transaction(async (tx) => {
      await tx.statusHistory.deleteMany({ where: { progress: { studentId: id } } }).catch(() => {})
      await tx.evaluation.deleteMany({ where: { studentId: id } }).catch(() => {})
      await tx.memorizationProgress.deleteMany({ where: { studentId: id } }).catch(() => {})
      await tx.memorizedSurah.deleteMany({ where: { studentId: id } }).catch(() => {})
      await tx.attendance.deleteMany({ where: { studentId: id } }).catch(() => {})
      await tx.studentBadge.deleteMany({ where: { studentId: id } }).catch(() => {})
      await tx.parentStudentLink.deleteMany({ where: { studentId: id } }).catch(() => {})
      await tx.starsLog.deleteMany({ where: { studentId: id } }).catch(() => {})
      await tx.studentStats.deleteMany({ where: { studentId: id } }).catch(() => {})
      await tx.student.delete({ where: { id } })
      await tx.user.delete({ where: { id: student.user.id } })
    }, { maxWait: 5000, timeout: 10000 })  // ← AJOUTÉ : timeout 10000ms

    return NextResponse.json({ ok: true, message: "Élève supprimé avec succès" })
  } catch (error: any) {
    console.error("[STUDENT DELETE ERROR]", error)
    return NextResponse.json({ error: error.message || "Erreur lors de la suppression" }, { status: 500 })
  }
}