import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

// Schéma de validation inline (évite les dépendances externes)
const createGroupSchema = z.object({
  name: z.string().min(2, "Nom trop court"),
  nameAr: z.string().optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  maxCapacity: z.number().min(1).max(50).default(15),
  teacherId: z.string().min(1, "Enseignant requis"),
  schedule: z.record(z.string()).optional().default({}),
})

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { schoolId, role, id: userId } = session.user
    const { searchParams } = new URL(req.url)
    const mine = searchParams.get("mine") === "true"

    // Base : filtrer par école
    const where: Record<string, unknown> = { 
      schoolId,
      isActive: true 
    }

    // Teacher : ne voit que ses propres groupes
    if (mine && role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({ 
        where: { userId } 
      })
      if (teacher) {
        where.teacherId = teacher.id
      }
    }

    const groups = await prisma.group.findMany({
      where,
      include: {
        teacher: { 
          include: { 
            user: { select: { fullName: true } } 
          } 
        },
        students: {
          include: {
            user: { select: { fullName: true, email: true } },
          },
        },
        _count: { select: { students: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ groups }, { status: 200 })
  } catch (error: any) {
    console.error("[GROUPS GET ERROR]", error?.message || String(error))
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.schoolId || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { schoolId } = session.user
    const body = await req.json()
    const parsed = createGroupSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { name, nameAr, level, maxCapacity, teacherId, schedule } = parsed.data

    const group = await prisma.group.create({
      data: {
        name,
        nameAr,
        level,
        maxCapacity,
        schedule: schedule ?? {},
        schoolId,
        teacherId,
      },
    })

    return NextResponse.json({ group }, { status: 201 })
  } catch (error: any) {
    console.error("[GROUPS POST ERROR]", error?.message || String(error))
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
