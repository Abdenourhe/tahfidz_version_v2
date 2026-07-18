// src/app/admin/super/site-config/page.tsx
// Page serveur : charge les configurations globales pour l'éditeur superadmin.

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { SiteConfigClient } from "@/components/superadmin/SiteConfigClient"
import { defaultLandingContent } from "@/lib/landing/default-content"
import { defaultPageContents } from "@/lib/site-config/page-defaults"
import { migrateEmailTemplatesIfDefault, type EmailTemplate, type EmailTemplateKey } from "@/lib/email-templates"
import type { LandingContent } from "@/lib/landing/default-content"
import type { SitePageConfig, SitePageKey } from "@/lib/site-config/page-types"

const PAGE_KEYS: SitePageKey[] = [
  'privacy',
  'terms',
  'security',
  'contact',
  'updates',
  'help',
  'docs',
  'api-docs',
]

export default async function SiteConfigPage() {
  const session = await auth()

  if (!session?.user || session.user.role !== "SUPERADMIN") {
    redirect("/login")
  }

  const [landingConfig, globalConfig, pageConfigs] = await Promise.all([
    prisma.siteConfig.findUnique({ where: { key: "landing" } }),
    prisma.siteConfig.findUnique({ where: { key: "global" } }),
    prisma.siteConfig.findMany({
      where: { key: { in: PAGE_KEYS } },
    }),
  ])

  const landingValue = (landingConfig?.value ?? defaultLandingContent) as Record<
    "fr" | "en" | "ar",
    LandingContent
  >
  const rawGlobalValue = globalConfig?.value ?? {
    emails: {
      welcome: { subject: "", body: "" },
      "reset-password": { subject: "", body: "" },
      "invite-parent": { subject: "", body: "" },
    },
    banner: { enabled: false, message: "", link: "", type: "info" },
  }

  const migratedEmails = migrateEmailTemplatesIfDefault(
    (rawGlobalValue as any)?.emails as Partial<Record<EmailTemplateKey, EmailTemplate>>
  )

  const globalValue = {
    ...(rawGlobalValue as any),
    emails: migratedEmails,
  }

  const pageConfigsMap = Object.fromEntries(
    PAGE_KEYS.map((key) => {
      const config = pageConfigs.find((c) => c.key === key)
      const value = (config?.value ?? defaultPageContents[key]) as SitePageConfig
      const defaults = defaultPageContents[key]
      return [
        key,
        {
          fr: { ...defaults.fr, ...value.fr },
          en: { ...defaults.en, ...value.en },
          ar: { ...defaults.ar, ...value.ar },
        },
      ]
    })
  ) as Record<SitePageKey, SitePageConfig>

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Contenu du site</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Modifiez la landing page, les contenus globaux et les pages statiques de la plateforme.
      </p>
      <SiteConfigClient
        initialLanding={landingValue}
        initialGlobal={globalValue}
        initialPages={pageConfigsMap}
      />
    </div>
  )
}
