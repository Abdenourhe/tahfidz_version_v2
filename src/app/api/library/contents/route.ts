// src/app/api/library/contents/route.ts

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { libraryContentSchema, libraryEpisodeSchema } from "@/lib/validations/library"
import { canManageLibrary } from "@/lib/library/permissions"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const collectionId = searchParams.get("collectionId") || undefined
    const categoryId = searchParams.get("categoryId") || undefined
    const type = searchParams.get("type") || undefined
    const status = searchParams.get("status") || undefined
    const search = searchParams.get("search") || undefined
    const visibility = searchParams.get("visibility") || undefined

    const isAdmin = ["ADMIN", "SUPERADMIN", "TEACHER"].includes(session.user.role)

    const where: Record<string, unknown> = {}

    // Visibilité et tenant
    if (visibility === "GLOBAL") {
      where.visibility = "GLOBAL"
    } else {
      where.schoolId = session.user.schoolId
      if (!isAdmin) where.status = "PUBLISHED"
      else if (status) where.status = status
    }

    if (collectionId) where.collectionId = collectionId
    if (categoryId) where.categoryId = categoryId
    if (type) where.type = type
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { has: search } },
      ]
    }

    const [contents, total] = await Promise.all([
      prisma.libraryContent.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { id: true, name: true, color: true } },
          collection: { select: { id: true, name: true, groupId: true } },
          _count: { select: { episodes: true } },
        },
      }),
      prisma.libraryContent.count({ where }),
    ])

    return NextResponse.json({ contents, total, page, limit })
  } catch (error: any) {
    console.error("[LIBRARY CONTENTS GET]", error)
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

    const contentSchema = z.object({
      ...libraryContentSchema.shape,
      episodes: z.array(libraryEpisodeSchema).optional(),
    })

    const parsed = contentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { episodes, ...contentData } = parsed.data

    // Validation cohérence visibility / collection
    if (contentData.visibility === "CLASS" && !contentData.collectionId) {
      return NextResponse.json({ error: "Une collection est requise pour la visibilité CLASS" }, { status: 400 })
    }

    if (contentData.collectionId) {
      const collection = await prisma.libraryCollection.findFirst({
        where: { id: contentData.collectionId, schoolId: session.user.schoolId },
      })
      if (!collection) return NextResponse.json({ error: "Collection introuvable" }, { status: 404 })
    }

    // Validation catégorie
    const category = await prisma.libraryCategory.findFirst({
      where: {
        id: contentData.categoryId,
        OR: [{ schoolId: session.user.schoolId }, { schoolId: null }],
      },
    })
    if (!category) return NextResponse.json({ error: "Catégorie introuvable" }, { status: 404 })

    const content = await prisma.libraryContent.create({
      data: {
        ...contentData,
        schoolId: contentData.visibility === "GLOBAL" ? null : session.user.schoolId,
        createdBy: session.user.id,
        episodes: episodes?.length ? { create: episodes } : undefined,
      },
      include: { episodes: true },
    })

    return NextResponse.json({ content }, { status: 201 })
  } catch (error: any) {
    console.error("[LIBRARY CONTENTS POST]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
