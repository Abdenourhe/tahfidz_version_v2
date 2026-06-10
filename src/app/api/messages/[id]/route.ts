// src/app/api/messages/[id]/route.ts
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { id } = await params
  const message = await prisma.directMessage.findUnique({
    where: { id, deletedAt: null },
    select: { id: true, schoolId: true, fromUserId: true },
  })
  if (!message) return NextResponse.json({ error: "Message introuvable" }, { status: 404 })
  if (message.schoolId !== session.user.schoolId) return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  if (message.fromUserId !== session.user.id) return NextResponse.json({ error: "Vous ne pouvez supprimer que vos messages" }, { status: 403 })

  await prisma.directMessage.update({ where: { id }, data: { deletedAt: new Date() } })
  return NextResponse.json({ success: true })
}
