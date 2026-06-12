// src/app/api/library/contents/[id]/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { libraryContentSchema, libraryEpisodeSchema } from "@/lib/validations/library"
import { canAccessContent, canEditLibraryResource, canManageLibrary } from "@/lib/library/permissions"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = await params
    const content = await prisma.libraryContent.findUnique({
      where: { id },
      include: {
        category: true,
        collection: { include: { group: { select: { id: true, name: true } } } },
        episodes: { orderBy: { episodeOrder: "asc" } },
      },
    })

    if (!content) return NextResponse.json({ error: "Contenu introuvable" }, { status: 404 })

    const accessible = await canAccessContent(session.user as any, content as any)
    if (!accessible) return NextResponse.json({ error: "Non autorisé" }, { status: 403 })

    // Progression pour l'utilisateur connecté
    let progress = null
    if (session.user.role === "STUDENT" || session.user.role === "TEACHER" || session.user.role === "PARENT") {
      progress = await prisma.userContentProgress.findUnique({
        where: { userId_contentId: { userId: session.user.id, contentId: id } },
      })
    }

    const bookmark = await prisma.userBookmark.findFirst({
      where: { userId: session.user.id, contentId: id },
      select: { id: true },
    })

    return NextResponse.json({ content, progress, isBookmarked: !!bookmark })
  } catch (error: any) {
    console.error("[LIBRARY CONTENT GET]", error)
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
    const existing = await prisma.libraryContent.findUnique({
      where: { id },
      include: { episodes: true },
    })
    if (!existing) return NextResponse.json({ error: "Contenu introuvable" }, { status: 404 })

    if (!canEditLibraryResource(session.user as any, existing.schoolId ?? "", existing.createdBy)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    let body: unknown
    try { body = await req.json() } catch { return NextResponse.json({ error: "Corps invalide" }, { status: 400 }) }

    const contentSchema = z.object({
      ...libraryContentSchema.partial().shape,
      episodes: z.array(libraryEpisodeSchema).optional(),
    })

    const parsed = contentSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { episodes, ...contentData } = parsed.data

    if (contentData.collectionId) {
      const collection = await prisma.libraryCollection.findFirst({
        where: { id: contentData.collectionId, schoolId: session.user.schoolId },
      })
      if (!collection) return NextResponse.json({ error: "Collection introuvable" }, { status: 404 })
    }

    const content = await prisma.libraryContent.update({
      where: { id },
      data: {
        ...contentData,
        schoolId: contentData.visibility === "GLOBAL" ? null : session.user.schoolId,
        episodes: episodes?.length
          ? { deleteMany: {}, create: episodes }
          : undefined,
      },
      include: { episodes: true },
    })

    return NextResponse.json({ content })
  } catch (error: any) {
    console.error("[LIBRARY CONTENT PATCH]", error)
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
    const existing = await prisma.libraryContent.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Contenu introuvable" }, { status: 404 })

    if (!canEditLibraryResource(session.user as any, existing.schoolId ?? "", existing.createdBy)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    await prisma.libraryContent.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[LIBRARY CONTENT DELETE]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
