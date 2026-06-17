// src/app/api/site-config/[key]/route.ts
// Endpoint public de lecture d'une configuration globale du site.

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const ALLOWED_KEYS = ["landing", "global"]

export async function GET(_req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params

  if (!ALLOWED_KEYS.includes(key)) {
    return NextResponse.json({ error: "Clé invalide" }, { status: 400 })
  }

  try {
    const config = await prisma.siteConfig.findUnique({ where: { key } })
    if (!config) {
      return NextResponse.json({ error: "Configuration non trouvée" }, { status: 404 })
    }
    return NextResponse.json({ key: config.key, value: config.value })
  } catch (error) {
    console.error("[SITE_CONFIG_GET]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
