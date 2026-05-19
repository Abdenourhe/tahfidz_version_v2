import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id } = await params

  // ADMIN / TEACHER : accès complet
  if (["ADMIN", "TEACHER", "SUPERADMIN"].includes(session.user.role)) {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: { fullName: true, fullNameAr: true, email: true, phone: true, gender: true, isActive: true } },
        group: { select: { name: true, level: true } },
        teacher: { include: { user: { select: { fullName: true } } } },
        memorizationProgress: { include: { surah: true }, orderBy: { updatedAt: "desc" } },
        studentBadges: { include: { badge: true }, orderBy: { earnedAt: "desc" } },
        parentLinks: { include: { parent: { include: { user: { select: { fullName: true } } } } } },
      },
    })
    return NextResponse.json({ student })
  }

  // PARENT : vérifier que l'élève est bien son enfant
  if (session.user.role === "PARENT") {
    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: { childrenLinks: { where: { isVerified: true }, select: { studentId: true } } },
    })

    // ✅ CORRECTION : await params AVANT le .some()
    const isChild = parent?.childrenLinks.some(l => l.studentId === id)
    
    if (!isChild) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: { fullName: true, fullNameAr: true } },
        group: { select: { name: true } },
        memorizationProgress: { include: { surah: true }, orderBy: { updatedAt: "desc" } },
        studentBadges: { include: { badge: true } },
      },
    })
    return NextResponse.json({ student })
  }

  // STUDENT : voir son propre profil uniquement
  if (session.user.role === "STUDENT") {
    const student = await prisma.student.findFirst({
      where: { id, userId: session.user.id },
      include: {
        user: { select: { fullName: true, fullNameAr: true } },
        group: { select: { name: true } },
        memorizationProgress: { include: { surah: true } },
        studentBadges: { include: { badge: true } },
      },
    })
    if (!student) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }
    return NextResponse.json({ student })
  }

  return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
}

// DELETE — suppression définitive d'un élève
export async function DELETE(
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
    // Vérifier que l'élève appartient à l'école
    const student = await prisma.student.findFirst({
      where: { id, user: { schoolId } },
      include: { user: true },
    })

    if (!student) {
      return NextResponse.json({ error: "Élève introuvable" }, { status: 404 })
    }

    // Supprimer en cascade (dans l'ordre des dépendances)
    await prisma.$transaction([
      // 1. Supprimer les liens parent-élève
      prisma.parentStudentLink.deleteMany({ where: { studentId: id } }),
      // 2. Supprimer les logs d'étoiles
      prisma.starsLog.deleteMany({ where: { studentId: id } }),
      // 3. Supprimer les badges
      prisma.studentBadge.deleteMany({ where: { studentId: id } }),
      // 4. Supprimer les présences
      prisma.attendance.deleteMany({ where: { studentId: id } }),
      // 5. Supprimer les évaluations
      prisma.evaluation.deleteMany({ where: { studentId: id } }),
      // 6. Supprimer l'historique de statut
      prisma.statusHistory.deleteMany({ where: { progress: { studentId: id } } }),
      // 7. Supprimer la progression
      prisma.memorizationProgress.deleteMany({ where: { studentId: id } }),
      // 8. Supprimer les stats
      prisma.studentStats.deleteMany({ where: { studentId: id } }),
      // 9. Supprimer les sourates mémorisées
      prisma.memorizedSurah.deleteMany({ where: { studentId: id } }),
      // 10. Supprimer le profil élève
      prisma.student.delete({ where: { id } }),
      // 11. Supprimer l'utilisateur
      prisma.user.delete({ where: { id: student.userId } }),
    ])

    // Audit log
    await prisma.auditLog.create({
      data: {
        schoolId,
        userId: session.user.id,
        action: "DELETE_STUDENT",
        entityType: "student",
        entityId: id,
        oldValues: { fullName: student.user.fullName, email: student.user.email },
      },
    })

    return NextResponse.json({ success: true, message: "Élève supprimé définitivement" })

  } catch (error: any) {
    console.error("[DELETE STUDENT ERROR]", error?.message || String(error))
    return NextResponse.json(
      { error: error?.message || "Erreur lors de la suppression" },
      { status: 500 }
    )
  }
}