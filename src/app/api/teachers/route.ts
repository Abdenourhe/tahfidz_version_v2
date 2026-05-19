import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { schoolId, role } = session.user
    if (!["ADMIN", "SUPERADMIN", "TEACHER"].includes(role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const teachers = await prisma.teacher.findMany({
      where: { 
        user: { schoolId } 
      },
      include: {
        user: { 
          select: { 
            id: true,
            fullName: true, 
            fullNameAr: true,
            email: true, 
            avatar: true, 
            gender: true,
            phone: true,
            isActive: true,
          } 
        },
        groups: { 
          select: { id: true, name: true, level: true } 
        },
        _count: { 
          select: { students: true, evaluations: true } 
        },
      },
      orderBy: { user: { fullName: "asc" } },
    })

    return NextResponse.json({ teachers }, { status: 200 })
  } catch (error: any) {
    console.error("[TEACHERS GET ERROR]", error?.message || error)
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération des enseignants" }, 
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

    const { schoolId, id: adminId } = session.user

    // Parse body avec gestion d'erreur
    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 })
    }

    // Validation manuelle
    const { email, password, fullName, fullNameAr, phone, gender, specialization, maxStudents } = body

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 })
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Mot de passe min 6 caractères" }, { status: 400 })
    }
    if (!fullName || fullName.trim().length < 2) {
      return NextResponse.json({ error: "Nom complet requis" }, { status: 400 })
    }

    // Vérifier email unique dans la même école
    const existing = await prisma.user.findFirst({ 
      where: { 
        email: email.toLowerCase().trim(), 
        schoolId 
      } 
    })
    if (existing) {
      return NextResponse.json({ error: "Cet email est déjà utilisé dans cette école" }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const teacher = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        fullName,
        fullNameAr,
        phone,
        gender,
        role: "TEACHER",
        schoolId,
        teacherProfile: {
          create: {
            specialization,
            maxStudents: maxStudents ?? 20,
          },
        },
      },
      include: { teacherProfile: true },
    })

    return NextResponse.json({ teacher }, { status: 201 })
  } catch (error: any) {
    console.error("[TEACHERS POST ERROR]", error?.message || String(error))
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
