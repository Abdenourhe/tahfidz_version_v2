// src/app/api/parents/route.ts
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { createUserSchema } from "@/lib/validations/auth"
import bcrypt from "bcryptjs"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.schoolId || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { schoolId } = session.user
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search")

    const where: Record<string, unknown> = { user: { schoolId } }
    if (search) {
      where.user = {
        schoolId,
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }
    }

    const parents = await prisma.parent.findMany({
      where,
      include: {
        user: { 
          select: { 
            fullName: true, 
            fullNameAr: true, 
            email: true, 
            phone: true, 
            isActive: true, 
            createdAt: true 
          } 
        },
        childrenLinks: {
          where: { isVerified: true },
          include: { 
            student: { 
              include: { 
                user: { select: { fullName: true } } 
              } 
            } 
          },
        },
        _count: { select: { childrenLinks: true } },
      },
      orderBy: { user: { createdAt: "desc" } },
    })

    return NextResponse.json({ parents }, { status: 200 })
  } catch (error) {
    console.error("[PARENTS GET ERROR]", error)
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération des parents" }, 
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.schoolId || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé — Admin requis" }, { status: 403 })
    }

    const { schoolId } = session.user

    // Parse body avec gestion d'erreur
    let body
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 })
    }

    const parsed = createUserSchema.safeParse({ ...body, role: "PARENT" })
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { email, password, fullName, fullNameAr, phone, gender } = parsed.data

    // ✅ CORRECTION : Vérifier email unique PAR ÉCOLE (pas globalement)
    const existing = await prisma.user.findFirst({ 
      where: {
        email: email.toLowerCase().trim(),
        schoolId,
      },
    })
    if (existing) {
      return NextResponse.json({ error: "Cet email est déjà utilisé dans cette école" }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const parent = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        fullName,
        fullNameAr,
        phone,
        gender,
        role: "PARENT",
        schoolId,
        parentProfile: { create: {} },
      },
      include: { parentProfile: true },
    })

    return NextResponse.json({ parent }, { status: 201 })
  } catch (error) {
    console.error("[PARENTS POST ERROR]", error)
    return NextResponse.json(
      { error: "Erreur serveur lors de la création du parent" },
      { status: 500 }
    )
  }
}
