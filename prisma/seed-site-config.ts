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
        body: `Bonjour {{fullName}},

Nous avons le plaisir de vous accueillir sur {{appName}}.{{#schoolName}} Votre école {{schoolName}} a été créée avec succès et est prête à être configurée.{{/schoolName}}{{^schoolName}} Votre compte a été créé avec succès.{{/schoolName}}

{{#schoolSlug}}Identifiant de votre école : {{schoolSlug}}
{{/schoolSlug}}
{{#password}}Voici vos identifiants de connexion :
• Adresse email : {{email}}
• Mot de passe temporaire : {{password}}
• Profil : {{role}}

Pour des raisons de sécurité, nous vous invitons à modifier votre mot de passe dès votre première connexion.{{/password}}
{{^password}}Vous pouvez dès maintenant vous connecter à votre espace administrateur à l'aide de l'adresse email que vous nous avez communiquée lors de votre inscription.{{/password}}

Cliquez sur le lien ci-dessous pour accéder à la plateforme :
{{loginUrl}}

Si vous avez la moindre question, notre équipe reste à votre disposition.

Cordialement,
L'équipe {{appName}}`,
      },
      "reset-password": {
        subject: "Réinitialisation de votre mot de passe",
        body: "Bonjour {{fullName}},\n\nVous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien suivant pour choisir un nouveau mot de passe :\n\n{{resetUrl}}\n\nCe lien est valable 20 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.\n\nCordialement,\nL'équipe {{appName}}",
      },
      "invite-parent": {
        subject: "Invitation à rejoindre {{appName}}",
        body: "Bonjour{{#fullName}} {{fullName}},{{/fullName}}\n\nVous avez été invité à suivre la progression de {{studentName}} sur {{appName}}.\n\nCliquez sur le lien suivant pour activer votre compte :\n\n{{inviteUrl}}\n\nCe lien est valable 30 jours.\n\nCordialement,\nL'équipe {{appName}}",
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
