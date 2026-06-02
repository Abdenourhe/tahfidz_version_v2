// src/app/api/auth/parent-register/route.ts
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import crypto from "crypto"

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export async function POST(req: Request) {
  try {
    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 })
    }

    const { fullName, fullNameAr, email, phone, gender, relation, password, inviteCode, studentCode, nationality, spokenLanguages } = body

    if (!fullName || !email || !password || !inviteCode || !studentCode) {
      return NextResponse.json({ error: "Tous les champs obligatoires ne sont pas remplis" }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Mot de passe min 6 caractères" }, { status: 400 })
    }

    // Vérifier l'invitation
    const invite = await prisma.parentInvite.findUnique({
      where: { code: inviteCode.toUpperCase() },
      include: { student: { include: { user: { select: { schoolId: true } } } } },
    })

    if (!invite) {
      return NextResponse.json({ error: "Code d'invitation invalide" }, { status: 404 })
    }

    if (invite.used) {
      return NextResponse.json({ error: "Cette invitation a déjà été utilisée" }, { status: 409 })
    }

    if (new Date() > invite.expiresAt) {
      return NextResponse.json({ error: "Cette invitation a expiré" }, { status: 410 })
    }

    if (invite.student.studentCode !== studentCode) {
      return NextResponse.json({ error: "Le code élève ne correspond pas à l'invitation" }, { status: 400 })
    }

    const schoolId = invite.student.user.schoolId

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { slug: true },
    })
    if (!school) {
      return NextResponse.json({ error: "École introuvable" }, { status: 404 })
    }

    // Vérifier si l'email existe déjà dans l'école
    const existingUser = await prisma.user.findFirst({
      where: { email: email.toLowerCase().trim(), schoolId },
      include: { parentProfile: true },
    })

    const accessCode = crypto.randomBytes(4).toString("hex").toUpperCase()

    // ── CAS 1 : Parent déjà existant (2ème enfant, etc.) ──
    if (existingUser) {
      if (existingUser.role !== "PARENT" || !existingUser.parentProfile) {
        return NextResponse.json({ error: "Cet email est déjà utilisé dans cette école avec un autre rôle" }, { status: 409 })
      }

      const existingLink = await prisma.parentStudentLink.findUnique({
        where: { parentId_studentId: { parentId: existingUser.parentProfile.id, studentId: invite.studentId } },
      })

      if (existingLink) {
        return NextResponse.json({ error: "Vous êtes déjà lié à cet élève" }, { status: 409 })
      }

      await prisma.$transaction(async (tx) => {
        await tx.parentStudentLink.create({
          data: {
            parentId: existingUser.parentProfile!.id,
            studentId: invite.studentId,
            relation: relation && typeof relation === "string" ? relation.trim() : "guardian",
            accessCode,
            isVerified: true,
          },
        })

        await tx.parentInvite.update({
          where: { id: invite.id },
          data: { used: true, usedAt: new Date() },
        })
      })

      return NextResponse.json({
        success: true,
        existingParent: true,
        message: "Lien ajouté avec succès. Connectez-vous pour accéder à votre compte.",
        schoolSlug: school.slug,
      }, { status: 200 })
    }

    // ── CAS 2 : Nouveau parent ──
    const hashedPassword = await bcrypt.hash(password, 12)

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          fullName: fullName.trim(),
          fullNameAr: fullNameAr?.trim() || null,
          phone: phone?.trim() || null,
          gender: gender === "MALE" || gender === "FEMALE" ? gender : null,
          role: "PARENT",
          schoolId,
          isActive: true,
        },
      })

      const parent = await tx.parent.create({
        data: {
          userId: user.id,
          nationality: nationality || null,
          spokenLanguages: spokenLanguages || null,
        },
      })

      await tx.parentStudentLink.create({
        data: {
          parentId: parent.id,
          studentId: invite.studentId,
          relation: "guardian",
          accessCode,
          isVerified: true,
        },
      })



      await tx.parentInvite.update({
        where: { id: invite.id },
        data: { used: true, usedAt: new Date() },
      })

      return user
    })

    // Créer une notification pour un admin de l'école
    const admin = await prisma.user.findFirst({
      where: { schoolId, role: "ADMIN" },
      orderBy: { createdAt: "asc" },
    })

    if (admin) {
      await prisma.notification.create({
        data: {
          schoolId,
          userId: admin.id,
          type: "PARENT_REGISTERED",
          title: "Nouveau parent inscrit",
          titleAr: "ولي أمر جديد مسجل",
          message: `${fullName} s'est inscrit et lié à l'élève via QR code.`,
          messageAr: `سجل ${fullName} وارتبط بالطالب عبر رمز الاستجابة السريعة.`,
          data: { parentId: result.id, studentId: invite.studentId },
        },
      })
    }

    return NextResponse.json({
      success: true,
      existingParent: false,
      message: "Inscription réussie",
      userId: result.id,
      schoolSlug: school.slug,
    }, { status: 201 })
  } catch (error: any) {
    console.error("[PARENT_REGISTER ERROR]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
