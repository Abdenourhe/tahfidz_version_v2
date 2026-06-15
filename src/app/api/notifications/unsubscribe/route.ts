// src/app/api/notifications/unsubscribe/route.ts
// POST: Supprimer la souscription push de l'utilisateur connecté

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await req.json()
    const { endpoint } = body

    await prisma.pushSubscription.deleteMany({
      where: {
        userId: session.user.id,
        ...(endpoint ? { endpoint } : {}),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[NOTIFICATIONS UNSUBSCRIBE]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}
