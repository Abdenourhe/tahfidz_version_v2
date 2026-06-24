// src/app/api/site-config/landing/plans/route.ts
// Endpoint public de lecture des plans tarifaires de la landing page.
// Les quotas techniques restent définis dans src/lib/halaqa-quota.ts.

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { defaultLandingContent, normalizeLandingContent } from "@/lib/landing/default-content"
import type { LandingContent } from "@/lib/landing/default-content"

type Lang = "fr" | "en" | "ar"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const rawLang = searchParams.get("lang") ?? "fr"
  const lang: Lang = rawLang === "ar" ? "ar" : rawLang === "en" ? "en" : "fr"

  try {
    const config = await prisma.siteConfig.findUnique({ where: { key: "landing" } })
    const rawContent = (config?.value as Record<Lang, LandingContent> | undefined) ?? defaultLandingContent

    const normalized = normalizeLandingContent(rawContent[lang], lang)

    return NextResponse.json(
      {
        currency: normalized.pricing.currency,
        period: normalized.pricing.period,
        request: normalized.pricing.request,
        popular: normalized.pricing.popular,
        plans: normalized.pricing.plans,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    )
  } catch (error) {
    console.error("[SITE_CONFIG_LANDING_PLANS]", error)
    const fallback = normalizeLandingContent(defaultLandingContent[lang], lang)
    return NextResponse.json(
      {
        currency: fallback.pricing.currency,
        period: fallback.pricing.period,
        request: fallback.pricing.request,
        popular: fallback.pricing.popular,
        plans: fallback.pricing.plans,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    )
  }
}
