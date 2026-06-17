// src/app/privacy/page.tsx
// Politique de confidentialité de TAHFIDZ (contenu éditable via SiteConfig).

import type { Metadata } from "next"
import { LegalPageLayout } from "@/components/layout/LegalPageLayout"
import { PageContentRenderer } from "@/components/site-config/PageContentRenderer"
import { loadPageConfig, getPageLang } from "@/lib/site-config/page-utils"

export async function generateMetadata(): Promise<Metadata> {
  const config = await loadPageConfig("privacy")
  const lang = await getPageLang()
  const content = config[lang]
  return {
    title: content.metaTitle ?? content.title,
    description: content.metaDescription,
  }
}

export default async function PrivacyPage() {
  const config = await loadPageConfig("privacy")
  const lang = await getPageLang()
  const content = config[lang]

  return (
    <LegalPageLayout title={content.title} lastUpdated={content.lastUpdated}>
      <PageContentRenderer sections={content.sections} />
    </LegalPageLayout>
  )
}
