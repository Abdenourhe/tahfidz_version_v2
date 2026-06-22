// src/app/terms/page.tsx
// Conditions d'utilisation de TAHFIDZ (contenu éditable via SiteConfig).

import type { Metadata } from "next"
import { LegalPageLayout } from "@/components/layout/LegalPageLayout"
import { PageContentRenderer } from "@/components/site-config/PageContentRenderer"
import { loadPageConfig, getPageLang } from "@/lib/site-config/page-utils"
import { requireAuth } from "@/lib/auth-page"

export async function generateMetadata(): Promise<Metadata> {
  const config = await loadPageConfig("terms")
  const lang = await getPageLang()
  const content = config[lang]
  return {
    title: content.metaTitle ?? content.title,
    description: content.metaDescription,
  }
}

export default async function TermsPage() {
  await requireAuth()
  const config = await loadPageConfig("terms")
  const lang = await getPageLang()
  const content = config[lang]

  return (
    <LegalPageLayout title={content.title} lastUpdated={content.lastUpdated}>
      <PageContentRenderer sections={content.sections} />
    </LegalPageLayout>
  )
}
