// prisma/seed-site-config.ts
// Seed des configurations globales du site : landing page, templates d'emails, bannière

import { prisma } from "@/lib/prisma"
import { defaultLandingContent } from "@/lib/landing/default-content"

export async function seedSiteConfig() {
  // Configuration éditable de la landing page (fr / en / ar)
  await prisma.siteConfig.upsert({
    where: { key: "landing" },
    update: { value: defaultLandingContent },
    create: { key: "landing", value: defaultLandingContent },
  })
  console.log("✅ SiteConfig : landing")

  // Configuration globale par défaut : templates d'emails et bannière
  const globalConfig = {
    emails: {
      welcome: {
        subject: "Bienvenue sur TAHFIDZ",
        body: "Bonjour {{fullName}},\n\nBienvenue sur TAHFIDZ. Votre école est maintenant prête à être configurée.",
      },
      "reset-password": {
        subject: "Réinitialisation de votre mot de passe",
        body: "Bonjour {{fullName}},\n\nCliquez sur le lien suivant pour réinitialiser votre mot de passe : {{link}}\n\nCe lien est valable 24 heures.",
      },
      "invite-parent": {
        subject: "Invitation à rejoindre TAHFIDZ",
        body: "Bonjour,{{#studentName}}\n\nVous avez été invité à suivre la progression de {{studentName}} sur TAHFIDZ.{{/studentName}}\n\nCliquez ici pour activer votre compte : {{link}}",
      },
    },
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
