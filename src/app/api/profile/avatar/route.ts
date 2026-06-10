// POST /api/profile/avatar — Met à jour l'avatar de l'utilisateur connecté
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const { avatar } = await req.json()
    if (!avatar || typeof avatar !== "string" || !avatar.startsWith("data:image")) {
      return NextResponse.json({ error: "Image invalide" }, { status: 400 })
    }

    // Limite de taille ~500KB en base64
    if (avatar.length > 700_000) {
      return NextResponse.json({ error: "Image trop grande (max 500KB)" }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatar },
    })

    return NextResponse.json({ success: true, avatar })
  } catch (e: any) {
    console.error("[AVATAR UPLOAD]", e)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
