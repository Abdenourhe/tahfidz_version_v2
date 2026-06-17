// src/app/admin/super/site-config/page.tsx
// Page serveur : charge les configurations globales pour l'éditeur superadmin.

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { SiteConfigClient } from "@/components/superadmin/SiteConfigClient"
import { defaultLandingContent } from "@/lib/landing/default-content"
import type { LandingContent } from "@/lib/landing/default-content"

export default async function SiteConfigPage() {
  const session = await auth()

  if (!session?.user || session.user.role !== "SUPERADMIN") {
    redirect("/login")
  }

  const [landingConfig, globalConfig] = await Promise.all([
    prisma.siteConfig.findUnique({ where: { key: "landing" } }),
    prisma.siteConfig.findUnique({ where: { key: "global" } }),
  ])

  const landingValue = (landingConfig?.value ?? defaultLandingContent) as Record<
    "fr" | "en" | "ar",
    LandingContent
  >
  const globalValue = globalConfig?.value ?? {
    emails: {
      welcome: { subject: "", body: "" },
      "reset-password": { subject: "", body: "" },
      "invite-parent": { subject: "", body: "" },
    },
    banner: { enabled: false, message: "", link: "", type: "info" },
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Contenu du site</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Modifiez la landing page publique et les contenus globaux de la plateforme.
      </p>
      <SiteConfigClient initialLanding={landingValue} initialGlobal={globalValue} />
    </div>
  )
}
