//src/app/api/students/route.ts

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

async function generateStudentCode(schoolId: string): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.student.count({ where: { user: { schoolId } } })
  return `TAH-${year}-${String(count + 1).padStart(3, "0")}`
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    const { schoolId, role } = session.user
    if (!["ADMIN", "TEACHER", "SUPERADMIN"].includes(role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }
    const students = await prisma.student.findMany({
      where: { user: { schoolId } },
      include: {
        user: { select: { id: true, fullName: true, fullNameAr: true, email: true, avatar: true, gender: true, phone: true } },
        group: { select: { id: true, name: true } },
        teacher: { include: { user: { select: { fullName: true } } } },
        _count: { select: { memorizationProgress: true, evaluations: true, attendances: true } },
      },
      orderBy: { user: { fullName: "asc" } },
    })
    return NextResponse.json({ students }, { status: 200 })
  } catch (error) {
    console.error("[STUDENTS GET ERROR]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.schoolId || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé — Admin requis" }, { status: 403 })
    }
    const { schoolId, id: adminId } = session.user

    let body
    try { body = await req.json() } catch {
      return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 })
    }

    const { email, password, fullName, fullNameAr, phone, gender, dateOfBirth, groupId, teacherId } = body

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 })
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Mot de passe min 6 caractères" }, { status: 400 })
    }
    if (!fullName || fullName.trim().length < 2) {
      return NextResponse.json({ error: "Nom complet requis" }, { status: 400 })
    }

    const existing = await prisma.user.findFirst({
      where: { email: email.toLowerCase().trim(), schoolId }
    })
    if (existing) {
      return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 })
    }

    let resolvedTeacherId = teacherId || null
    if (groupId) {
      const group = await prisma.group.findFirst({
        where: { id: groupId, schoolId },
        select: { id: true, teacherId: true }
      })
      if (!group) return NextResponse.json({ error: "Groupe introuvable" }, { status: 400 })
      resolvedTeacherId = group.teacherId
    } else if (teacherId) {
      const teacher = await prisma.teacher.findFirst({
        where: { id: teacherId, user: { schoolId } }
      })
      if (!teacher) return NextResponse.json({ error: "Enseignant introuvable" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const studentCode = await generateStudentCode(schoolId)

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        fullName: fullName.trim(),
        fullNameAr: fullNameAr?.trim() || null,
        phone: phone?.trim() || null,
        gender: gender || "MALE",
        role: "STUDENT",
        schoolId,
        studentProfile: {
          create: {
            studentCode,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            groupId: groupId || null,
            teacherId: resolvedTeacherId,
            currentSurahId: null,
            totalStars: 0,
            currentStreak: 0,
            longestStreak: 0,
            lastActivityDate: null,
            status: "active",
          },
        },
      },
      include: {
        studentProfile: {
          include: {
            group: { select: { name: true } },
            teacher: { include: { user: { select: { fullName: true } } } },
          },
        },
      },
    })

    await prisma.studentStats.create({
      data: {
        studentId: user.studentProfile!.id,
        totalSurahsMemorized: 0,
        totalVersesMemorized: 0,
        totalEvaluationScore: 0,
        evaluationCount: 0,
        averageScore: 0,
        attendanceRate: 0,
        currentStreakStart: null,
        longestStreakStart: null,
        longestStreakEnd: null,
        lastCalculatedAt: new Date(),
      },
    })

    const studentProfileId = user.studentProfile?.id || user.id

    // Audit log — CORRIGÉ avec entityType/entityId + valeurs par défaut
    await prisma.auditLog.create({
      data: {
        schoolId,
        userId: adminId,
        action: "CREATE_STUDENT",
        actorId: adminId,
        actorRole: session.user.role,
        actorEmail: session.user.email || "admin@system.local",
        actorName: session.user.name || session.user.email || "Administrateur",
        entityType: "student",
        entityId: studentProfileId,
        targetType: "student",
        targetId: studentProfileId,
        targetName: user.fullName,
        newValues: {
          email: user.email,
          fullName: user.fullName,
          studentCode,
          groupId: groupId || null,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: "Élève créé avec succès",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        fullNameAr: user.fullNameAr,
        studentProfile: user.studentProfile,
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error("[STUDENTS POST ERROR]", error)
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    )
  }
}