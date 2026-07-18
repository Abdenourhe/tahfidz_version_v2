// scripts/migrate-site-config-global.ts
// Migration des templates d'emails et de la bannière vers le format multilingue.

import { prisma } from "@/lib/prisma"
import { migrateEmailTemplatesToMultilingual } from "@/lib/email-templates"

type Lang = "fr" | "en" | "ar"
type BannerType = "info" | "warning" | "success" | "error"

interface Banner {
  enabled: boolean
  message: string
  link: string
  type: BannerType
}

function isBannerFlat(value: unknown): value is Banner {
  return (
    typeof value === "object" &&
    value !== null &&
    ("enabled" in value || "message" in value || "type" in value)
  )
}

function migrateBannerToMultilingual(raw: unknown): Record<Lang, Banner> {
  if (isBannerFlat(raw)) {
    const validType: BannerType = ["info", "warning", "success", "error"].includes(raw.type)
      ? raw.type
      : "info"
    const banner: Banner = {
      enabled: raw.enabled ?? false,
      message: raw.message ?? "",
      link: raw.link ?? "",
      type: validType,
    }
    return { fr: banner, en: banner, ar: banner }
  }

  const defaultBanner: Banner = { enabled: false, message: "", link: "", type: "info" }
  const asRecord = (raw ?? {}) as Partial<Record<Lang, Partial<Banner>>>
  const validType = (type: unknown): BannerType =>
    ["info", "warning", "success", "error"].includes(type as string) ? (type as BannerType) : "info"

  return {
    fr: { ...defaultBanner, ...(asRecord.fr ?? {}), type: validType(asRecord.fr?.type) },
    en: { ...defaultBanner, ...(asRecord.en ?? {}), type: validType(asRecord.en?.type) },
    ar: { ...defaultBanner, ...(asRecord.ar ?? {}), type: validType(asRecord.ar?.type) },
  }
}

async function main() {
  const config = await prisma.siteConfig.findUnique({ where: { key: "global" } })
  if (!config) {
    console.log("ℹ️ Aucune config globale trouvée. Rien à migrer.")
    return
  }

  const value = config.value as Record<string, unknown>
  let updated = false

  // ── Emails ─────────────────────────────────────────────────────────
  const emails = value.emails as Record<string, unknown> | undefined
  if (emails) {
    const isAlreadyMultilingual = Object.values(emails).some(
      (tpl: any) => tpl && (tpl.fr || tpl.en || tpl.ar)
    )

    if (!isAlreadyMultilingual) {
      value.emails = migrateEmailTemplatesToMultilingual(emails as any)
      updated = true
      console.log("✅ Templates d'emails migrés vers le format multilingue.")
    } else {
      console.log("✅ Les templates sont déjà au format multilingue.")
    }
  }

  // ── Bannière ───────────────────────────────────────────────────────
  const banner = value.banner
  const migratedBanner = migrateBannerToMultilingual(banner)

  if (banner !== migratedBanner) {
    value.banner = migratedBanner as any
    updated = true
    console.log("✅ Bannière migrée vers le format multilingue.")
  } else {
    console.log("✅ La bannière est déjà au format multilingue.")
  }

  if (updated) {
    await prisma.siteConfig.update({
      where: { key: "global" },
      data: { value: value as any },
    })
    console.log("✅ Configuration globale mise à jour.")
  } else {
    console.log("✅ Aucune modification nécessaire.")
  }
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => {
    console.error("❌ Erreur de migration:", e)
    await prisma.$disconnect()
    process.exit(1)
  })
