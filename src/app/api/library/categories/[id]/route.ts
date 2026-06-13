// src/app/api/library/categories/[id]/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { libraryCategorySchema } from "@/lib/validations/library"
import { canEditLibraryResource, canManageLibrary } from "@/lib/library/permissions"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== "SUPERADMIN" && !session.user.schoolId)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = await params
    const category = await prisma.libraryCategory.findUnique({ where: { id } })
    if (!category) return NextResponse.json({ error: "Catégorie introuvable" }, { status: 404 })

    // Accès : globale ou de son école
    if (session.user.role !== "SUPERADMIN" && category.schoolId && category.schoolId !== session.user.schoolId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    return NextResponse.json({ category })
  } catch (error: any) {
    console.error("[LIBRARY CATEGORY GET]", error)
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
    const existing = await prisma.libraryCategory.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Catégorie introuvable" }, { status: 404 })

    if (!canEditLibraryResource(session.user as any, existing.schoolId ?? "", existing.createdBy)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    let body: unknown
    try { body = await req.json() } catch { return NextResponse.json({ error: "Corps invalide" }, { status: 400 }) }

    const parsed = libraryCategorySchema.partial().safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const category = await prisma.libraryCategory.update({
      where: { id },
      data: parsed.data,
    })

    return NextResponse.json({ category })
  } catch (error: any) {
    console.error("[LIBRARY CATEGORY PATCH]", error)
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
    const existing = await prisma.libraryCategory.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Catégorie introuvable" }, { status: 404 })

    if (!canEditLibraryResource(session.user as any, existing.schoolId ?? "", existing.createdBy)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    await prisma.libraryCategory.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[LIBRARY CATEGORY DELETE]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
