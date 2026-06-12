// src/app/api/library/contents/[id]/bookmark/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { canAccessContent } from "@/lib/library/permissions"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

    const { id } = await params
    const bookmark = await prisma.userBookmark.findUnique({
      where: { userId_contentId: { userId: session.user.id, contentId: id } },
    })

    return NextResponse.json({ isBookmarked: !!bookmark, bookmark })
  } catch (error: any) {
    console.error("[LIBRARY BOOKMARK GET]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

    const { id } = await params
    const content = await prisma.libraryContent.findUnique({
      where: { id },
      include: { collection: true },
    })
    if (!content) return NextResponse.json({ error: "Contenu introuvable" }, { status: 404 })

    const accessible = await canAccessContent(session.user as any, content as any)
    if (!accessible) return NextResponse.json({ error: "Non autorisé" }, { status: 403 })

    let body: unknown
    try { body = await req.json() } catch { body = {} }
    const { note } = (body as { note?: string }) || {}

    const bookmark = await prisma.userBookmark.upsert({
      where: { userId_contentId: { userId: session.user.id, contentId: id } },
      update: { note },
      create: { userId: session.user.id, contentId: id, note },
    })

    return NextResponse.json({ bookmark }, { status: 201 })
  } catch (error: any) {
    console.error("[LIBRARY BOOKMARK POST]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

    const { id } = await params
    await prisma.userBookmark.deleteMany({
      where: { userId: session.user.id, contentId: id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[LIBRARY BOOKMARK DELETE]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
