// src/app/api/library/collections/[id]/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { libraryCollectionSchema } from "@/lib/validations/library"
import { canAccessCollection, canEditLibraryResource, canManageLibrary } from "@/lib/library/permissions"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = await params
    const collection = await prisma.libraryCollection.findUnique({
      where: { id },
      include: {
        group: { select: { id: true, name: true } },
        contents: {
          where: { status: { not: "ARCHIVED" } },
          orderBy: [{ status: "asc" }, { createdAt: "desc" }],
          include: {
            category: { select: { id: true, name: true, color: true } },
            _count: { select: { episodes: true } },
          },
        },
      },
    })

    if (!collection) return NextResponse.json({ error: "Collection introuvable" }, { status: 404 })
    if (collection.schoolId !== session.user.schoolId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    // Les non-admins ne voient que les collections actives
    const isAdmin = ["ADMIN", "SUPERADMIN", "TEACHER"].includes(session.user.role)
    if (!collection.isActive && !isAdmin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    return NextResponse.json({ collection })
  } catch (error: any) {
    console.error("[LIBRARY COLLECTION GET]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user || !canManageLibrary(session.user as any)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const { id } = await params
    const existing = await prisma.libraryCollection.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Collection introuvable" }, { status: 404 })

    if (!canEditLibraryResource(session.user as any, existing.schoolId, existing.createdBy)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    let body: unknown
    try { body = await req.json() } catch { return NextResponse.json({ error: "Corps invalide" }, { status: 400 }) }

    const parsed = libraryCollectionSchema.partial().safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    if (parsed.data.groupId) {
      const group = await prisma.group.findFirst({
        where: { id: parsed.data.groupId, schoolId: session.user.schoolId },
      })
      if (!group) return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 })
    }

    const collection = await prisma.libraryCollection.update({
      where: { id },
      data: parsed.data,
    })

    return NextResponse.json({ collection })
  } catch (error: any) {
    console.error("[LIBRARY COLLECTION PATCH]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user || !canManageLibrary(session.user as any)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const { id } = await params
    const existing = await prisma.libraryCollection.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Collection introuvable" }, { status: 404 })

    if (!canEditLibraryResource(session.user as any, existing.schoolId, existing.createdBy)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    await prisma.libraryCollection.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[LIBRARY COLLECTION DELETE]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
