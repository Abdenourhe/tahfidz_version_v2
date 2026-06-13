// src/app/api/library/contents/[id]/pdf/route.ts
// Route protégée : génère une URL signée de lecture du PDF ou redirige vers l'URL existante.

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { canAccessContent } from "@/lib/library/permissions"
import { getDownloadUrl, getR2KeyFromUrl } from "@/lib/r2"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = await params

    const content = await prisma.libraryContent.findUnique({
      where: { id },
      include: {
        collection: { include: { group: { select: { id: true, name: true } } } },
      },
    })

    if (!content || !content.pdfUrl) {
      return NextResponse.json({ error: "Contenu introuvable" }, { status: 404 })
    }

    const accessible = await canAccessContent(session.user as any, content as any)
    if (!accessible) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const r2Key = getR2KeyFromUrl(content.pdfUrl)

    if (r2Key) {
      const signedUrl = await getDownloadUrl(r2Key, 600)
      return NextResponse.redirect(signedUrl, { status: 302 })
    }

    // Rétrocompatibilité : ancienne URL HTTP/HTTPS externe
    return NextResponse.redirect(content.pdfUrl, { status: 302 })
  } catch (error: any) {
    console.error("[LIBRARY PDF GET]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}
