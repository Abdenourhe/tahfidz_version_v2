// src/app/api/notifications/[id]/route.ts
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  await prisma.notification.deleteMany({
    where: { id: (await params).id, userId: session.user.id },
  })

  return NextResponse.json({ success: true })
}
