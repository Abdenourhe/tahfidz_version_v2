// src/app/api/library/register-file/route.ts
// Enregistre un fichier uploadé avec son hash SHA-256 pour la déduplication future.

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
    if (
      !body ||
      typeof body !== "object" ||
      typeof body.hash !== "string" ||
      typeof body.key !== "string" ||
      typeof body.fileName !== "string" ||
      typeof body.contentType !== "string" ||
      typeof body.size !== "number"
    ) {
      return NextResponse.json({ error: "Champs invalides" }, { status: 400 })
    }

    const { hash, key, fileName, contentType, size } = body as {
      hash: string
      key: string
      fileName: string
      contentType: string
      size: number
    }

    const schoolId = session.user.schoolId ?? null

    // Éviter les doublons dans la table UploadedFile (idempotence).
    const existing = await prisma.uploadedFile.findFirst({
      where: { hash, key },
    })

    if (!existing) {
      await prisma.uploadedFile.create({
        data: {
          schoolId,
          hash,
          key,
          fileName,
          contentType,
          size,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[LIBRARY REGISTER FILE]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
