// src/app/api/library/upload/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { canManageLibrary } from "@/lib/library/permissions"

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
]
const MAX_SIZE = 2 * 1024 * 1024 // 2 MB

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || !canManageLibrary(session.user as any)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 })
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Format non accepté" }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Fichier trop grand (max 2 Mo)" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString("base64")
    const dataUri = `data:${file.type};base64,${base64}`

    return NextResponse.json({ url: dataUri, size: file.size, mimeType: file.type })
  } catch (error: any) {
    console.error("[LIBRARY UPLOAD]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
