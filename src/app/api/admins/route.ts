// src/app/api/admins/route.ts
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"

const createSchema = z.object({
  fullName:   z.string().min(2),
  fullNameAr: z.string().optional(),
  email:      z.string().email(),
  phone:      z.string().optional(),
  password:   z.string().min(8),
})

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const schoolId = session?.user?.schoolId
  if (!schoolId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", schoolId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, fullName: true, fullNameAr: true, email: true, phone: true,
      isActive: true, createdAt: true, lastLoginAt: true,
    },
  })

  return NextResponse.json({ admins })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const schoolId = session?.user?.schoolId
  if (!schoolId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Corps invalide" }, { status: 400 }) }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    const errors = Object.entries(parsed.error.flatten().fieldErrors)
      .map(([k, v]) => `${k}: ${v?.join(", ")}`).join("; ")
    return NextResponse.json({ error: errors || "Données invalides" }, { status: 400 })
  }

  const { fullName, fullNameAr, email, phone, password } = parsed.data

  const existing = await prisma.user.findFirst({ where: { email, schoolId } })
  if (existing) return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 })

  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      email, password: hashedPassword,
      fullName, fullNameAr, phone, role: "ADMIN",
      schoolId,
      adminProfile: { create: {} },
    },
  })

  await prisma.auditLog.create({
    data: {
      schoolId: session.user.schoolId,
      userId: session.user.id,
      action: "create",
      entityType: "admin",
      entityId: user.id,
      newValues: { email, fullName } as any,
    } as any,
  })

  return NextResponse.json({ user: { id: user.id, email, fullName } }, { status: 201 })
}
