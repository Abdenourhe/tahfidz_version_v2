// src/app/api/library/images/[key]/route.ts
// Redirection signée vers une image stockée sur R2 (bucket privé).

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getDownloadUrl } from "@/lib/r2"

type Params = { params: Promise<{ key: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { key: encodedKey } = await params
    const key = decodeURIComponent(encodedKey)

    const signedUrl = await getDownloadUrl(key, 600)
    return NextResponse.redirect(signedUrl, { status: 302 })
  } catch (error: any) {
    console.error("[LIBRARY IMAGE GET]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}
