// src/lib/site-config/page-types.ts
// Types pour les pages éditables via SiteConfig (légales, contact, placeholders).

export type SitePageLang = 'fr' | 'en' | 'ar'

export type SitePageKey =
  | 'privacy'
  | 'terms'
  | 'security'
  | 'contact'
  | 'updates'
  | 'help'
  | 'docs'
  | 'api-docs'

export type PageSection = {
  title: string
  body: string
}

export type ContactCard = {
  icon: string
  title: string
  value: string
  href?: string
}

export type PageContent = {
  title: string
  metaTitle?: string
  metaDescription?: string
  lastUpdated?: string
  intro?: string
  sections: PageSection[]
  contactCards?: ContactCard[]
}

export type SitePageConfig = Record<SitePageLang, PageContent>
