// src/app/security/page.tsx
// Sécurité et conformité de TAHFIDZ (contenu éditable via SiteConfig).

import type { Metadata } from "next"
import { LegalPageLayout } from "@/components/layout/LegalPageLayout"
import { PageContentRenderer } from "@/components/site-config/PageContentRenderer"
import { loadPageConfig, getPageLang } from "@/lib/site-config/page-utils"

export async function generateMetadata(): Promise<Metadata> {
  const config = await loadPageConfig("security")
  const lang = await getPageLang()
  const content = config[lang]
  return {
    title: content.metaTitle ?? content.title,
    description: content.metaDescription,
  }
}

export default async function SecurityPage() {
  const config = await loadPageConfig("security")
  const lang = await getPageLang()
  const content = config[lang]

  return (
    <LegalPageLayout title={content.title} lastUpdated={content.lastUpdated}>
      <PageContentRenderer sections={content.sections} />
    </LegalPageLayout>
  )
}
