// src/app/api/admin/site-config/route.ts
// Liste toutes les configurations globales du site (SUPERADMIN only).

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

async function requireSuperAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPERADMIN") return null
  return session
}

export async function GET() {
  if (!(await requireSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 401 })
  }

  try {
    const configs = await prisma.siteConfig.findMany({ orderBy: { key: "asc" } })
    return NextResponse.json({ configs })
  } catch (error) {
    console.error("[ADMIN_SITE_CONFIG_LIST]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
