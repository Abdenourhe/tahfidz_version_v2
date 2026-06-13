// src/app/api/library/upload/route.ts
// Génère une URL d'upload signée vers Cloudflare R2.

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { canManageLibrary } from "@/lib/library/permissions"
import { buildR2Key, getUploadUrl } from "@/lib/r2"

export const runtime = "nodejs"

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "video/mp4",
  "video/webm",
]

const MAX_SIZE = 5 * 1024 * 1024 * 1024 // 5 GB (limite R2 par objet)

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || !canManageLibrary(session.user as any)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Corps invalide" }, { status: 400 })
    }

    const { filename, contentType, size } = body as { filename?: string; contentType?: string; size?: number }

    if (!filename || !contentType) {
      return NextResponse.json({ error: "filename et contentType sont requis" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json({ error: "Format non accepté" }, { status: 400 })
    }

    if (typeof size === "number" && size > MAX_SIZE) {
      return NextResponse.json({ error: "Fichier trop grand" }, { status: 400 })
    }

    const key = buildR2Key(session.user.schoolId ?? null, filename)
    const uploadUrl = await getUploadUrl(key, contentType, 300)

    return NextResponse.json({ uploadUrl, key })
  } catch (error: any) {
    console.error("[LIBRARY UPLOAD]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}
