// scripts/check-legal-configs.ts
// Vérifie et supprime les configs légales vides qui écrasent les defaults.

import { prisma } from "@/lib/prisma"

async function main() {
  const keys = ["privacy", "terms", "security"]

  for (const key of keys) {
    const config = await prisma.siteConfig.findUnique({ where: { key } })
    if (!config) {
      console.log(`Config '${key}' : absente (defaults utilisés)`)
      continue
    }

    const value = config.value as Record<string, any>
    const isEmpty = !value?.fr?.sections?.length && !value?.en?.sections?.length && !value?.ar?.sections?.length

    if (isEmpty) {
      await prisma.siteConfig.delete({ where: { key } })
      console.log(`Config '${key}' : vide supprimée (defaults utilisés)`)
    } else {
      console.log(`Config '${key}' : présente avec contenu`)
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
