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
        totalStars: true,
        currentStreak: true,
        groupId: true,
        teacherId: true,
        user: {
          select: {
            id: true, fullName: true, fullNameAr: true, email: true,
            phone: true, gender: true, avatar: true, isActive: true, createdAt: true,
          },
        },
        group:   { select: { id: true, name: true, level: true } },
        teacher: { include: { user: { select: { fullName: true, phone: true, email: true } } } },
        parentLinks: {
          include: { parent: { include: { user: { select: { fullName: true, phone: true, email: true } } } } },
          where: { isVerified: true },
        },
        _count: { select: { memorizedSurahs: true } },
      },
    })

    if (!student) return NextResponse.json({ error: "Élève non trouvé" }, { status: 404 })

    const isAuthorized =
      ["ADMIN", "SUPERADMIN", "TEACHER"].includes(session.user.role) ||
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

      await prisma.notification.createMany({
        data: targets.map(userId => ({ userId, schoolId, ...notifBase })),
      })

      return NextResponse.json({ success: true, message: "Transfert effectué" })
    }

    // ── ACTION : mise à jour générale (défaut) ───────────────────────────
    const body = await req.json()
    const { email, phone, emergencyPhone, fullName, fullNameAr, gender,
            isActive, groupId, teacherId, address, city, postalCode,
            medicalNotes, currentSurahNote, avatar } = body

    const existingStudent = await prisma.student.findUnique({ where: { id }, include: { user: true } })
    if (!existingStudent) return NextResponse.json({ error: "Élève non trouvé" }, { status: 404 })

    const isAuthorized =
      session.user.role === "SUPERADMIN" ||
      (session.user.role === "ADMIN" && session.user.schoolId === existingStudent.user.schoolId) ||
      (session.user.role === "TEACHER" && existingStudent.teacherId === (session.user as any).teacherProfile?.id)

    if (!isAuthorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 })

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
    if (groupId !== undefined)   studentUpdate.groupId   = groupId || null
    if (teacherId !== undefined) studentUpdate.teacherId = teacherId || null
    if (address !== undefined)   studentUpdate.address   = address || null
    if (city !== undefined)      studentUpdate.city      = city || null
    if (postalCode !== undefined) studentUpdate.postalCode = postalCode || null
    if (medicalNotes !== undefined) studentUpdate.medicalNotes = medicalNotes || null
    if (currentSurahNote !== undefined) studentUpdate.currentSurahNote = currentSurahNote || null

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