// src/app/api/messages/[id]/read/route.ts
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { id } = await params
  const message = await prisma.directMessage.findUnique({
    where: { id, deletedAt: null },
    select: { id: true, schoolId: true, toUserId: true },
  })
  if (!message) return NextResponse.json({ error: "Message introuvable" }, { status: 404 })
  if (message.schoolId !== session.user.schoolId) return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  if (message.toUserId !== session.user.id) return NextResponse.json({ error: "Non autorisé" }, { status: 403 })

  await prisma.directMessage.update({ where: { id }, data: { isRead: true } })
  return NextResponse.json({ success: true })
}
