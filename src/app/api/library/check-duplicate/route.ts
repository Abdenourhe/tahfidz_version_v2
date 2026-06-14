// src/app/api/library/check-duplicate/route.ts
// Vérifie si un fichier avec le même hash SHA-256 a déjà été uploadé.

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== "object" || typeof body.hash !== "string") {
      return NextResponse.json({ error: "hash requis" }, { status: 400 })
    }

    const { hash } = body as { hash: string }
    const schoolId = session.user.schoolId ?? null

    // Recherche par hash. Si l'utilisateur est rattaché à une école, on privilégie un fichier de la même école.
    // Les fichiers globaux (schoolId = null) sont aussi réutilisables par tout le monde.
    const existing = await prisma.uploadedFile.findFirst({
      where: {
        hash,
        OR: [
          { schoolId: null },
          { schoolId },
        ],
      },
      orderBy: [
        { schoolId: "desc" }, // non-null first (school-specific preferred)
        { createdAt: "desc" },
      ],
    })

    if (!existing) {
      return NextResponse.json({ duplicate: false })
    }

    return NextResponse.json({
      duplicate: true,
      key: existing.key,
      url: `r2://${existing.key}`,
      fileName: existing.fileName,
      contentType: existing.contentType,
      size: existing.size,
    })
  } catch (error: any) {
    console.error("[LIBRARY CHECK DUPLICATE]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
