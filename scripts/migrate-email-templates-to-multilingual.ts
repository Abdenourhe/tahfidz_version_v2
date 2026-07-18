// scripts/migrate-email-templates-to-multilingual.ts
// Migration des templates d'emails du format plat au format multilingue.

import { prisma } from "@/lib/prisma"
import { migrateEmailTemplatesToMultilingual } from "@/lib/email-templates"

async function main() {
  const config = await prisma.siteConfig.findUnique({ where: { key: "global" } })
  if (!config) {
    console.log("ℹ️ Aucune config globale trouvée. Rien à migrer.")
    return
  }

  const value = config.value as Record<string, unknown>
  const emails = value.emails as Record<string, unknown> | undefined

  if (!emails) {
    console.log("ℹ️ Aucun template d'email trouvé. Rien à migrer.")
    return
  }

  // Si déjà au format multilingue, ne rien faire
  const isAlreadyMultilingual = Object.values(emails).some(
    (tpl: any) => tpl && (tpl.fr || tpl.en || tpl.ar)
  )

  if (isAlreadyMultilingual) {
    console.log("✅ Les templates sont déjà au format multilingue.")
    return
  }

  const migrated = migrateEmailTemplatesToMultilingual(emails as any)

  await prisma.siteConfig.update({
    where: { key: "global" },
    data: { value: { ...value, emails: migrated } as any },
  })

  console.log("✅ Templates d'emails migrés vers le format multilingue.")
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => {
    console.error("❌ Erreur de migration:", e)
    await prisma.$disconnect()
    process.exit(1)
  })
