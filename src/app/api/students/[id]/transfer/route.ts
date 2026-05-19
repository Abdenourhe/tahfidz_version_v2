// src/app/api/students/[id]/transfer/route.ts
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id: studentId } = await params
    const { schoolId } = session.user

    const { newGroupId, newTeacherId, reason } = await req.json()

    const student = await prisma.student.findUnique({
      where: { id: studentId },
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

    if (!student) {
      return NextResponse.json({ error: "Élève introuvable" }, { status: 404 })
    }

    const newGroup = newGroupId 
      ? await prisma.group.findUnique({ 
          where: { id: newGroupId }, 
          include: { teacher: { include: { user: { select: { id: true, fullName: true } } } } } 
        }) 
      : null

    const newTeacher = newTeacherId 
      ? await prisma.teacher.findUnique({ 
          where: { id: newTeacherId }, 
          include: { user: { select: { id: true } } } 
        }) 
      : null

    const oldGroupName = student.group?.name ?? "aucun"
    const newGroupName = newGroup?.name ?? "aucun"

    // Update student
    await prisma.student.update({
      where: { id: studentId },
      data: {
        ...(newGroupId !== undefined && { groupId: newGroupId || null }),
        ...(newTeacherId !== undefined && { teacherId: newTeacherId || null }),
      },
    })

    // ✅ CORRECTION : Audit log avec connect pour school et user
    await prisma.auditLog.create({
      data: {
        action: "TRANSFER_STUDENT",
        entityType: "student",
        entityId: studentId,
        oldValues: { groupId: student.groupId, teacherId: student.teacherId },
        newValues: { groupId: newGroupId, teacherId: newTeacherId, reason },
        school: { connect: { id: schoolId } },
        user: { connect: { id: session.user.id } },
      },
    })

    // Notifications
    const notifBase = {
      type: "transfer",
      title: `Transfert de groupe — ${student.user.fullName}`,
      titleAr: `نقل مجموعة — ${student.user.fullName}`,
      message: `${student.user.fullName} a été transféré de ${oldGroupName} vers ${newGroupName}.${reason ? ` Raison : ${reason}` : ""}`,
      messageAr: `تم نقل ${student.user.fullName} من ${oldGroupName} إلى ${newGroupName}.`,
      data: { studentId, oldGroupId: student.groupId, newGroupId },
    }

    const notifTargets: string[] = [student.user.id]
    student.parentLinks.forEach(link => notifTargets.push(link.parent.user.id))
    if (student.teacher?.user?.id) notifTargets.push(student.teacher.user.id)
    if (newGroup?.teacher?.user?.id && newGroup.teacher.user.id !== student.teacher?.user.id) notifTargets.push(newGroup.teacher.user.id)

    await prisma.notification.createMany({
      data: notifTargets.map(userId => ({
        userId,
        schoolId,
        ...notifBase,
      })),
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[TRANSFER ERROR]", error?.message || String(error))
    return NextResponse.json({ error: error?.message || "Erreur serveur" }, { status: 500 })
  }
}
