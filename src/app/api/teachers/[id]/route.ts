import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.schoolId || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé — Admin requis" }, { status: 403 })
    }

    const { id } = await params
    const { schoolId } = session.user

    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 })
    }

    const { fullName, fullNameAr, email, phone, gender, isActive, specialization, maxStudents, bio, password } = body

    // Vérifier que le teacher existe et appartient à l'école
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: { user: true },
    })
    if (!teacher || teacher.user.schoolId !== schoolId) {
      return NextResponse.json({ error: "Enseignant introuvable" }, { status: 404 })
    }

    // Validation
    if (email && !isValidEmail(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 })
    }
    if (fullName !== undefined && fullName.trim().length < 2) {
      return NextResponse.json({ error: "Nom complet requis (min 2 caractères)" }, { status: 400 })
    }
    if (password && password.length < 6) {
      return NextResponse.json({ error: "Mot de passe min 6 caractères" }, { status: 400 })
    }

    // Vérifier email unique dans la même école (si changé)
    if (email && email.toLowerCase().trim() !== teacher.user.email.toLowerCase()) {
      const existing = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase().trim(),
          schoolId,
          id: { not: teacher.userId },
        },
      })
      if (existing) {
        return NextResponse.json({ error: "Cet email est déjà utilisé dans cette école" }, { status: 409 })
      }
    }

    const userData: any = {}
    if (fullName !== undefined) userData.fullName = fullName.trim()
    if (fullNameAr !== undefined) userData.fullNameAr = fullNameAr.trim() || null
    if (email !== undefined) userData.email = email.toLowerCase().trim()
    if (phone !== undefined) userData.phone = phone.trim() || null
    if (gender !== undefined) userData.gender = gender || null
    if (isActive !== undefined) userData.isActive = !!isActive
    if (password) userData.password = await bcrypt.hash(password, 12)

    const teacherData: any = {}
    if (specialization !== undefined) teacherData.specialization = specialization.trim() || null
    if (maxStudents !== undefined) teacherData.maxStudents = Math.max(1, parseInt(maxStudents) || 20)
    if (bio !== undefined) teacherData.bio = bio.trim() || null

    const [updatedUser, updatedTeacher] = await prisma.$transaction([
      prisma.user.update({
        where: { id: teacher.userId },
        data: userData,
      }),
      prisma.teacher.update({
        where: { id },
        data: teacherData,
      }),
    ])

    return NextResponse.json({ user: updatedUser, teacher: updatedTeacher }, { status: 200 })
  } catch (error: any) {
    console.error("[TEACHERS PUT ERROR]", error?.message || String(error))
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.schoolId || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé — Admin requis" }, { status: 403 })
    }

    const { id } = await params
    const { schoolId } = session.user

    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        user: true,
        _count: {
          select: {
            groups: true,
            evaluations: true,
            exams: true,
            students: true,
            memorizationAssignments: true,
          },
        },
      },
    })

    if (!teacher || teacher.user.schoolId !== schoolId) {
      return NextResponse.json({ error: "Enseignant introuvable" }, { status: 404 })
    }

    const { groups, evaluations, exams } = teacher._count
    if (groups > 0 || evaluations > 0 || exams > 0) {
      const parts = []
      if (groups > 0) parts.push(`${groups} groupe${groups > 1 ? "s" : ""}`)
      if (evaluations > 0) parts.push(`${evaluations} évaluation${evaluations > 1 ? "s" : ""}`)
      if (exams > 0) parts.push(`${exams} examen${exams > 1 ? "s" : ""}`)
      return NextResponse.json(
        { error: `Impossible de supprimer : cet enseignant est assigné à ${parts.join(", ")}. Veuillez d'abord réassigner ou supprimer ces ressources.` },
        { status: 409 }
      )
    }

    // Désassocier les élèves et progressions (teacherId optionnels)
    await prisma.$transaction([
      prisma.student.updateMany({
        where: { teacherId: id },
        data: { teacherId: null },
      }),
      prisma.memorizationProgress.updateMany({
        where: { teacherId: id },
        data: { teacherId: null },
      }),
      prisma.user.delete({
        where: { id: teacher.userId },
      }),
    ])

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error("[TEACHERS DELETE ERROR]", error?.message || String(error))
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
