// src/app/api/admin/site-config/[key]/route.ts
// Mise à jour d'une configuration globale du site (SUPERADMIN only).

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import {
  siteConfigLandingSchema,
  siteConfigGlobalSchema,
  siteConfigPageSchema,
} from "@/lib/validations/site-config"

async function requireSuperAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPERADMIN") return null
  return session
}

const PAGE_KEYS = ['privacy', 'terms', 'security', 'contact', 'updates', 'help', 'docs', 'api-docs'] as const

function isBannerFlat(value: unknown): value is { enabled?: boolean; message?: string; link?: string; type?: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    ("enabled" in value || "message" in value || "type" in value)
  )
}

function normalizeGlobalInput(data: unknown): unknown {
  if (typeof data !== "object" || data === null) return data
  const record = data as Record<string, unknown>
  if (record.banner && isBannerFlat(record.banner)) {
    const flatBanner = record.banner
    return {
      ...record,
      banner: { fr: flatBanner, en: flatBanner, ar: flatBanner },
    }
  }
  return data
}

const VALIDATORS: Record<string, (data: unknown) => { success: boolean; data?: any; error?: any }> = {
  landing: (data) => {
    const result = siteConfigLandingSchema.safeParse(data)
    return result.success ? { success: true, data: result.data } : { success: false, error: result.error.format() }
  },
  global: (data) => {
    const result = siteConfigGlobalSchema.safeParse(normalizeGlobalInput(data))
    return result.success ? { success: true, data: result.data } : { success: false, error: result.error.format() }
  },
  ...Object.fromEntries(
    PAGE_KEYS.map((key) => [
      key,
      (data: unknown) => {
        const result = siteConfigPageSchema.safeParse(data)
        return result.success ? { success: true, data: result.data } : { success: false, error: result.error.format() }
      },
    ])
  ),
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  if (!(await requireSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 401 })
  }

  const { key } = await params
  const validator = VALIDATORS[key]
  if (!validator) {
    return NextResponse.json({ error: "Clé invalide" }, { status: 400 })
  }

  try {
    const body = await req.json()
    const result = validator(body.value ?? body)
    if (!result.success) {
      return NextResponse.json({ error: "Données invalides", details: result.error }, { status: 400 })
    }

    const updated = await prisma.siteConfig.upsert({
      where: { key },
      update: { value: result.data },
      create: { key, value: result.data },
    })

    return NextResponse.json({ key: updated.key, value: updated.value })
  } catch (error) {
    console.error("[ADMIN_SITE_CONFIG_UPDATE]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
