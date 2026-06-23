// src/app/docs/page.tsx
// Documentation utilisateur (contenu éditable via SiteConfig).

import type { Metadata } from "next"
import { LegalPageLayout } from "@/components/layout/LegalPageLayout"
import { PageContentRenderer } from "@/components/site-config/PageContentRenderer"
import { loadPageConfig, getPageLang } from "@/lib/site-config/page-utils"

export async function generateMetadata(): Promise<Metadata> {
  const config = await loadPageConfig("docs")
  const lang = await getPageLang()
  const content = config[lang]
  return {
    title: content.metaTitle ?? content.title,
    description: content.metaDescription,
  }
}

export default async function DocsPage() {
  const config = await loadPageConfig("docs")
  const lang = await getPageLang()
  const content = config[lang]

  return (
    <LegalPageLayout title={content.title}>
      {content.intro && <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-8">{content.intro}</p>}
      <PageContentRenderer sections={content.sections} />
    </LegalPageLayout>
  )
}
