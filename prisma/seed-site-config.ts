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
        subject: "Bienvenue sur {{appName}}",
        body: "Bonjour {{fullName}},\n\nBienvenue sur {{appName}}.{{#schoolName}} Votre école {{schoolName}} est maintenant prête à être configurée.{{/schoolName}}{{^schoolName}} Votre compte a été créé avec succès.{{/schoolName}}\n\n{{#password}}Voici vos identifiants de connexion :\n• Email : {{email}}\n• Mot de passe : {{password}}\n• Rôle : {{role}}\n\n{{/password}}Connectez-vous ici : {{loginUrl}}\n\nPensez à changer votre mot de passe lors de votre première connexion.",
      },
      "reset-password": {
        subject: "Réinitialisation de votre mot de passe",
        body: "Bonjour {{fullName}},\n\nVous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien suivant pour choisir un nouveau mot de passe :\n\n{{resetUrl}}\n\nCe lien est valable 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.",
      },
      "invite-parent": {
        subject: "Invitation à rejoindre {{appName}}",
        body: "Bonjour{{#fullName}} {{fullName}},{{/fullName}}\n\nVous avez été invité à suivre la progression de {{studentName}} sur {{appName}}.\n\nCliquez sur le lien suivant pour activer votre compte :\n\n{{inviteUrl}}\n\nCe lien est valable 30 jours.",
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
