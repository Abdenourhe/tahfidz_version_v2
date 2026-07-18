// prisma/seed-site-config.ts
// Seed des configurations globales du site : landing page, templates d'emails, bannière

import { prisma } from "@/lib/prisma"
import { defaultLandingContent } from "@/lib/landing/default-content"
import { defaultEmailTemplates } from "@/lib/email-templates"

export async function seedSiteConfig() {
  // Configuration éditable de la landing page (fr / en / ar)
  await prisma.siteConfig.upsert({
    where: { key: "landing" },
    update: { value: defaultLandingContent },
    create: { key: "landing", value: defaultLandingContent },
  })
  console.log("✅ SiteConfig : landing")

  // Configuration globale par défaut : templates d'emails multilingues et bannière
  const globalConfig = {
    emails: defaultEmailTemplates,
    banner: {
      enabled: true,
      message: "🎉 Découvrez la nouvelle Halaqa Online électronique sur TAHFIDZ !",
      link: "/register-school",
      type: "info",
    },
  }

  await prisma.siteConfig.upsert({
    where: { key: "global" },
    update: { value: globalConfig },
    create: { key: "global", value: globalConfig },
  })
  console.log("✅ SiteConfig : global")
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedSiteConfig()
    .then(async () => { await prisma.$disconnect() })
    .catch(async (e) => {
      console.error("❌", e)
      await prisma.$disconnect()
      process.exit(1)
    })
}
