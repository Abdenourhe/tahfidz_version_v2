// src/app/api/library/categories/route.ts
// CRUD des catégories de bibliothèque

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { libraryCategorySchema } from "@/lib/validations/library"
import { canManageLibrary } from "@/lib/library/permissions"

const categoryCreateSchema = libraryCategorySchema.extend({
  isGlobal: z.boolean().default(false),
})

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const includeGlobal = searchParams.get("includeGlobal") !== "false"

    const categories = await prisma.libraryCategory.findMany({
      where: {
        isActive: true,
        OR: [
          { schoolId: session.user.schoolId },
          ...(includeGlobal ? [{ schoolId: null }] : []),
        ],
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    })

    return NextResponse.json({ categories })
  } catch (error: any) {
    console.error("[LIBRARY CATEGORIES GET]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || !canManageLibrary(session.user as any)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    let body: unknown
    try { body = await req.json() } catch { return NextResponse.json({ error: "Corps invalide" }, { status: 400 }) }

    const parsed = categoryCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { isGlobal, ...data } = parsed.data

    // Seul SUPERADMIN peut créer des catégories globales
    if (isGlobal && session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Non autorisé à créer une catégorie globale" }, { status: 403 })
    }

    const category = await prisma.libraryCategory.create({
      data: {
        ...data,
        schoolId: isGlobal ? null : session.user.schoolId,
        createdBy: session.user.id,
      },
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error: any) {
    console.error("[LIBRARY CATEGORIES POST]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
