// src/app/api/profile/notifications/route.ts
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const updateSchema = z.object({
  messageNotifications:    z.boolean().optional(),
  evaluationNotifications: z.boolean().optional(),
  attendanceNotifications: z.boolean().optional(),
  soundEnabled:            z.boolean().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      messageNotifications: true,
      evaluationNotifications: true,
      attendanceNotifications: true,
      soundEnabled: true,
    },
  })

  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
  return NextResponse.json(user)
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data,
    select: {
      messageNotifications: true,
      evaluationNotifications: true,
      attendanceNotifications: true,
      soundEnabled: true,
    },
  })

  return NextResponse.json(updated)
}
