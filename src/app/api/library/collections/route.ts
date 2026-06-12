// src/app/api/library/collections/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { libraryCollectionSchema } from "@/lib/validations/library"
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
    const search = searchParams.get("search") || undefined
    const groupId = searchParams.get("groupId") || undefined

    const where: Record<string, unknown> = { schoolId: session.user.schoolId }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }
    if (groupId) where.groupId = groupId

    const [collections, total] = await Promise.all([
      prisma.libraryCollection.findMany({
        where,
        orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          group: { select: { id: true, name: true } },
          _count: { select: { contents: true, enrollments: true } },
        },
      }),
      prisma.libraryCollection.count({ where }),
    ])

    return NextResponse.json({ collections, total, page, limit })
  } catch (error: any) {
    console.error("[LIBRARY COLLECTIONS GET]", error)
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

    const parsed = libraryCollectionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    // Vérifier que le group appartient à l'école
    if (parsed.data.groupId) {
      const group = await prisma.group.findFirst({
        where: { id: parsed.data.groupId, schoolId: session.user.schoolId },
      })
      if (!group) return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 })
    }

    const collection = await prisma.libraryCollection.create({
      data: {
        ...parsed.data,
        schoolId: session.user.schoolId,
        createdBy: session.user.id,
      },
    })

    return NextResponse.json({ collection }, { status: 201 })
  } catch (error: any) {
    console.error("[LIBRARY COLLECTIONS POST]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
