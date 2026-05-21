//src/app/api/students/[id]/toggle/route.ts

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { id } = await params
  const { schoolId } = session.user

  try {
    const student = await prisma.student.findFirst({
      where: { id, user: { schoolId } },
      include: { user: true },
    })

    if (!student) {
      return NextResponse.json({ error: "Élève introuvable" }, { status: 404 })
    }

    const newStatus = !student.user.isActive

    await prisma.user.update({
      where: { id: student.userId },
      data: { isActive: newStatus },
    })

    // Audit log — CORRIGÉ avec entityType/entityId + valeurs par défaut
    await prisma.auditLog.create({
      data: {
        schoolId,
        userId: session.user.id,
        action: newStatus ? "ACTIVATE_STUDENT" : "DEACTIVATE_STUDENT",
        actorId: session.user.id,
        actorRole: session.user.role,
        actorEmail: session.user.email || "admin@system.local",
        actorName: session.user.name || session.user.email || "Administrateur",
        entityType: "student",
        entityId: id,
        targetType: "student",
        targetId: id,
        targetName: student.user.fullName,
        newValues: { isActive: newStatus },
      },
    })

    return NextResponse.json({
      success: true,
      message: newStatus ? "Élève activé" : "Élève désactivé",
      isActive: newStatus
    })

  } catch (error: any) {
    console.error("[TOGGLE STUDENT ERROR]", error)
    return NextResponse.json(
      { error: error.message || "Erreur lors du changement de statut" },
      { status: 500 }
    )
  }
}