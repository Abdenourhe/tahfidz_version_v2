// src/app/api/parents/[id]/route.ts
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  const parent = await prisma.parent.findUnique({
    where: { id: (await params).id },
    include: {
      user: { select: { id:true, fullName:true, fullNameAr:true, email:true, phone:true, isActive:true } },
      childrenLinks: { where:{isVerified:true}, include:{student:{include:{user:{select:{fullName:true}}}}} },
    },
  })
  if (!parent) return NextResponse.json({ error: "Introuvable" }, { status: 404 })
  return NextResponse.json({ parent: { ...parent, id: parent.user.id } })
}

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

    const { fullName, fullNameAr, email, phone, gender, isActive, password } = body

    const parent = await prisma.parent.findUnique({
      where: { id },
      include: { user: true },
    })
    if (!parent || parent.user.schoolId !== schoolId) {
      return NextResponse.json({ error: "Parent introuvable" }, { status: 404 })
    }

    if (email && !isValidEmail(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 })
    }
    if (fullName !== undefined && fullName.trim().length < 2) {
      return NextResponse.json({ error: "Nom complet requis (min 2 caractères)" }, { status: 400 })
    }
    if (password && password.length < 6) {
      return NextResponse.json({ error: "Mot de passe min 6 caractères" }, { status: 400 })
    }

    if (email && email.toLowerCase().trim() !== parent.user.email.toLowerCase()) {
      const existing = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase().trim(),
          schoolId,
          id: { not: parent.userId },
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

    const updatedUser = await prisma.user.update({
      where: { id: parent.userId },
      data: userData,
    })

    return NextResponse.json({ user: updatedUser }, { status: 200 })
  } catch (error: any) {
    console.error("[PARENTS PUT ERROR]", error?.message || String(error))
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

    const parent = await prisma.parent.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!parent || parent.user.schoolId !== schoolId) {
      return NextResponse.json({ error: "Parent introuvable" }, { status: 404 })
    }

    const userId = parent.userId

    // Supprimer les ressources liées au user qui n'ont pas de cascade automatique
    await prisma.$transaction([
      prisma.directMessage.deleteMany({
        where: { OR: [{ fromUserId: userId }, { toUserId: userId }] },
      }),
      prisma.announcement.deleteMany({
        where: { createdBy: userId },
      }),
      prisma.user.delete({
        where: { id: userId },
      }),
    ])

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error("[PARENTS DELETE ERROR]", error?.message || String(error))
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
