// GET /api/user/me — infos de base de l'utilisateur connecté
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { fullName: true, avatar: true, role: true, email: true },
  })

  if (!user) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 })
  }

  return NextResponse.json({ user })
}
