// src/app/api/library/progress/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { libraryProgressSchema } from "@/lib/validations/library"
import { canAccessContent } from "@/lib/library/permissions"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    let body: unknown
    try { body = await req.json() } catch { return NextResponse.json({ error: "Corps invalide" }, { status: 400 }) }

    const parsed = libraryProgressSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const content = await prisma.libraryContent.findUnique({
      where: { id: parsed.data.contentId },
      include: { collection: true },
    })
    if (!content) return NextResponse.json({ error: "Contenu introuvable" }, { status: 404 })

    const accessible = await canAccessContent(session.user as any, content as any)
    if (!accessible) return NextResponse.json({ error: "Non autorisé" }, { status: 403 })

    const isCompleted = parsed.data.progress >= 100

    const progress = await prisma.userContentProgress.upsert({
      where: { userId_contentId: { userId: session.user.id, contentId: content.id } },
      update: {
        progress: parsed.data.progress,
        lastPosition: parsed.data.lastPosition,
        isCompleted,
        completedAt: isCompleted ? new Date() : undefined,
      },
      create: {
        userId: session.user.id,
        contentId: content.id,
        progress: parsed.data.progress,
        lastPosition: parsed.data.lastPosition,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
    })

    return NextResponse.json({ progress })
  } catch (error: any) {
    console.error("[LIBRARY PROGRESS POST]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
