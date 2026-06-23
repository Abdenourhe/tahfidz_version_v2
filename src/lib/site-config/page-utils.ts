// src/lib/site-config/page-utils.ts
// Helpers de chargement et de détection de langue pour les pages éditables.

import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { defaultPageContents } from './page-defaults'
import type { SitePageConfig, SitePageKey, SitePageLang, PageContent } from './page-types'

export async function getPageLang(): Promise<SitePageLang> {
  const h = await headers()
  const accept = h.get('accept-language') ?? ''
  const code = accept.split(',')[0]?.trim().slice(0, 2).toLowerCase()
  if (code === 'ar') return 'ar'
  if (code === 'en') return 'en'
  return 'fr'
}

function mergePageContent(defaults: PageContent, value: Partial<PageContent> | undefined): PageContent {
  return {
    ...defaults,
    ...value,
    sections: value?.sections ?? defaults.sections,
    contactCards: value?.contactCards ?? defaults.contactCards,
  }
}

export async function loadPageConfig(key: SitePageKey): Promise<SitePageConfig> {
  const config = await prisma.siteConfig.findUnique({ where: { key } })
  if (!config?.value) return defaultPageContents[key]

  const value = config.value as SitePageConfig
  // Fusion avec les defaults pour garantir l'absence de champs manquants.
  const defaults = defaultPageContents[key]
  return {
    fr: mergePageContent(defaults.fr, value.fr),
    en: mergePageContent(defaults.en, value.en),
    ar: mergePageContent(defaults.ar, value.ar),
  }
}
