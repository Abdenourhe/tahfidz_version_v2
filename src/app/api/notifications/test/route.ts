// src/app/api/notifications/test/route.ts
// POST: Envoie une notification push de test à l'utilisateur connecté

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { sendPushToUser } from "@/lib/web-push"

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const result = await sendPushToUser(session.user.id, {
      title: "Test TAHFIDZ 🔔",
      body: "Vos notifications push fonctionnent !",
      url: "/",
      tag: "test",
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[NOTIFICATIONS TEST]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}
