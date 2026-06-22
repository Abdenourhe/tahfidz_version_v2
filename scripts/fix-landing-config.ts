// scripts/fix-landing-config.ts
// Corrige les labels du footer dans la config "landing" en base.

import { prisma } from "@/lib/prisma"
import { defaultLandingContent } from "@/lib/landing/default-content"

async function main() {
  const config = await prisma.siteConfig.findUnique({ where: { key: "landing" } })

  if (!config?.value) {
    console.log("Aucune config 'landing' en base. Les defaults seront utilisés.")
    console.log("Labels corrigés dans default-content.ts.")
    return
  }

  const value = config.value as Record<string, any>

  // Corrige les labels pour chaque langue
  for (const lang of ["fr", "en", "ar"] as const) {
    const langValue = value[lang]
    if (!langValue?.footer) continue

    const linksLegal = langValue.footer.linksLegal
    if (Array.isArray(linksLegal)) {
      for (const link of linksLegal) {
        if (link.href === "/privacy") link.label = "Confidentialité"
        if (link.href === "/security") link.label = "Sécurité"
      }
    }

    // Corrige les labels de navigation
    if (langValue.nav?.how === "Comment ca marche") {
      langValue.nav.how = "Comment ça marche"
    }

    // Corrige les titres de section
    if (langValue.how?.title === "Comment ca marche") {
      langValue.how.title = "Comment ça marche"
    }
  }

  await prisma.siteConfig.update({
    where: { key: "landing" },
    data: { value },
  })

  console.log("Config 'landing' mise à jour avec les labels corrigés.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
