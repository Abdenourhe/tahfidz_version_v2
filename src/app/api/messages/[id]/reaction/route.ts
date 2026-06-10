// src/app/api/messages/[id]/reaction/route.ts
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({ emoji: z.string().min(1).max(10) })

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { id: messageId } = await params
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Emoji invalide" }, { status: 400 })

  const { emoji } = parsed.data

  const message = await prisma.directMessage.findUnique({
    where: { id: messageId, deletedAt: null },
    select: { id: true, schoolId: true, fromUserId: true, toUserId: true },
  })
  if (!message) return NextResponse.json({ error: "Message introuvable" }, { status: 404 })
  if (message.schoolId !== session.user.schoolId) return NextResponse.json({ error: "Non autorisé" }, { status: 403 })

  // Toggle : si existe on supprime, sinon on crée
  const existing = await prisma.messageReaction.findUnique({
    where: { messageId_userId_emoji: { messageId, userId: session.user.id, emoji } },
  })

  if (existing) {
    await prisma.messageReaction.delete({ where: { id: existing.id } })
    return NextResponse.json({ reacted: false })
  } else {
    await prisma.messageReaction.create({
      data: { messageId, userId: session.user.id, emoji },
    })
    return NextResponse.json({ reacted: true })
  }
}
