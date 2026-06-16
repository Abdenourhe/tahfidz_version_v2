// src/app/api/parent/children/route.ts
// Retourne les enfants liés au parent connecté (pour les composants client)

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: {
        childrenLinks: {
          where: { isVerified: true },
          include: {
            student: {
              include: {
                user: { select: { fullName: true, fullNameAr: true, avatar: true } },
                group: { select: { id: true, name: true, schedule: true } },
                teacher: { include: { user: { select: { fullName: true } } } },
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ childrenLinks: parent?.childrenLinks || [] })
  } catch (error: any) {
    console.error("[PARENT CHILDREN GET]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}
