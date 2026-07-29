// src/app/api/legal/[page]/route.ts
// Endpoint public de lecture du contenu des pages légales (terms, privacy, etc.)

import { NextRequest, NextResponse } from "next/server"
import { loadPageConfig } from "@/lib/site-config/page-utils"
import type { SitePageKey, SitePageLang } from "@/lib/site-config/page-types"
import { defaultPageContents } from "@/lib/site-config/page-defaults"

const ALLOWED_PAGES: SitePageKey[] = [
  "terms",
  "privacy",
  "security",
  "contact",
  "updates",
  "help",
  "docs",
  "api-docs",
]

function isSitePageKey(key: string): key is SitePageKey {
  return ALLOWED_PAGES.includes(key as SitePageKey)
}

function isSitePageLang(lang: string): lang is SitePageLang {
  return lang === "fr" || lang === "en" || lang === "ar"
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ page: string }> }
) {
  const { page } = await params
  const { searchParams } = new URL(req.url)
  const langParam = searchParams.get("lang") ?? "fr"
  const lang = isSitePageLang(langParam) ? langParam : "fr"

  if (!isSitePageKey(page)) {
    return NextResponse.json({ error: "Page inconnue" }, { status: 400 })
  }

  try {
    const config = await loadPageConfig(page)
    const content = config[lang]

    return NextResponse.json({
      key: page,
      lang,
      title: content.title,
      lastUpdated: content.lastUpdated,
      sections: content.sections,
    })
  } catch (error) {
    console.error(`[LEGAL_GET] page=${page} lang=${lang}`, error)
    // Fallback sur le contenu par défaut si la base est inaccessible.
    const fallback = defaultPageContents[page][lang]
    return NextResponse.json({
      key: page,
      lang,
      title: fallback.title,
      lastUpdated: fallback.lastUpdated,
      sections: fallback.sections,
    })
  }
}
