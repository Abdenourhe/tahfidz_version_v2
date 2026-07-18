// src/lib/validations/site-config.ts
// Schémas Zod de validation pour les configurations globales du site

import { z } from "zod"

const landingSectionItemSchema = z.object({
  icon: z.string().min(1),
  title: z.string().min(1),
  desc: z.string().min(1),
})

const landingStepSchema = z.object({
  num: z.string().min(1),
  title: z.string().min(1),
  desc: z.string().min(1),
})

const landingRoleSchema = z.object({
  icon: z.string().min(1),
  role: z.string().min(1),
  desc: z.string().min(1),
})

const landingStatSchema = z.object({
  value: z.number().int().min(0),
  label: z.string().min(1),
  suffix: z.string(),
})

const landingTestimonialSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  text: z.string().min(1),
})

const landingPricingPlanSchema = z.object({
  key: z.enum(["FREE", "STARTER", "ECONOMIQUE", "PRO", "ENTERPRISE"]),
  name: z.string().min(1),
  students: z.string().min(1),
  monthlyPrice: z.string().min(1),
  yearlyPrice: z.string().min(1),
  price: z.string().min(1).optional(),
  monthlyFeatures: z.array(z.string().min(1)),
  yearlyFeatures: z.array(z.string().min(1)),
  features: z.array(z.string().min(1)).optional(),
  enabled: z.boolean().optional(),
})

const footerLinkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  external: z.boolean().optional(),
})

const landingContentSchema = z.object({
  dir: z.enum(["ltr", "rtl"]),
  nav: z.object({
    home: z.string().min(1),
    features: z.string().min(1),
    pricing: z.string().min(1),
    how: z.string().min(1),
    login: z.string().min(1),
    register: z.string().min(1),
  }),
  hero: z.object({
    badge: z.string(),
    title: z.string().min(1),
    titleHighlight: z.string().min(1),
    subtitle: z.string().min(1),
    ctaPrimary: z.string().min(1),
    ctaSecondary: z.string().min(1),
    stat1: z.string().min(1),
    stat2: z.string().min(1),
    stat3: z.string().min(1),
  }),
  features: z.object({
    title: z.string().min(1),
    subtitle: z.string().min(1),
    items: z.array(landingSectionItemSchema).min(1),
  }),
  how: z.object({
    title: z.string().min(1),
    subtitle: z.string().min(1),
    steps: z.array(landingStepSchema).min(1),
  }),
  users: z.object({
    title: z.string().min(1),
    subtitle: z.string().min(1),
    items: z.array(landingRoleSchema).min(1),
  }),
  stats: z.object({
    title: z.string().min(1),
    items: z.array(landingStatSchema).min(1),
  }),
  testimonials: z.object({
    title: z.string().min(1),
    items: z.array(landingTestimonialSchema).min(1),
  }),
  pricing: z.object({
    title: z.string().min(1),
    subtitle: z.string().min(1),
    period: z.enum(["month", "year"]),
    request: z.string().min(1),
    popular: z.string().min(1),
    perYear: z.string().min(1).optional(),
    currency: z.string().min(1),
    plans: z.array(landingPricingPlanSchema).min(1),
  }),
  cta: z.object({
    title: z.string().min(1),
    subtitle: z.string().min(1),
    button: z.string().min(1),
    sub: z.string().min(1),
  }),
  footer: z.object({
    desc: z.string().min(1),
    product: z.string().min(1),
    linksProduct: z.array(footerLinkSchema),
    support: z.string().min(1),
    linksSupport: z.array(footerLinkSchema),
    legal: z.string().min(1),
    linksLegal: z.array(footerLinkSchema),
    copyright: z.string().min(1),
  }),
})

export const siteConfigLandingSchema = z.record(z.enum(["fr", "en", "ar"]), landingContentSchema)

const emailTemplateSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
})

const emailLocaleTemplateSchema = z.object({
  fr: emailTemplateSchema,
  en: emailTemplateSchema,
  ar: emailTemplateSchema,
})

const bannerSchema = z.object({
  enabled: z.boolean(),
  message: z.string(),
  link: z.string(),
  type: z.enum(["info", "warning", "success", "error"]),
}).refine(
  (data) => !data.enabled || data.message.trim().length > 0,
  {
    message: "Le message est requis lorsque la bannière est activée.",
    path: ["message"],
  }
)

function isBannerFlat(value: unknown): value is { enabled?: boolean; message?: string; link?: string; type?: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    ("enabled" in value || "message" in value || "type" in value)
  )
}

const globalContentSchema = z.object({
  emails: z.object({
    welcome: emailLocaleTemplateSchema,
    "reset-password": emailLocaleTemplateSchema,
    "invite-parent": emailLocaleTemplateSchema,
  }),
  banner: z.record(
    z.enum(["fr", "en", "ar"]),
    bannerSchema
  ),
})

export const siteConfigGlobalSchema = z.preprocess(
  (input) => {
    if (typeof input !== "object" || input === null) return input
    const data = input as Record<string, unknown>
    if (data.banner && isBannerFlat(data.banner)) {
      const flatBanner = data.banner as { enabled?: boolean; message?: string; link?: string; type?: string }
      return {
        ...data,
        banner: {
          fr: flatBanner,
          en: flatBanner,
          ar: flatBanner,
        },
      }
    }
    return input
  },
  globalContentSchema
)

export type SiteConfigLandingInput = z.infer<typeof siteConfigLandingSchema>
export type SiteConfigGlobalInput = z.infer<typeof siteConfigGlobalSchema>

// ── Schémas pour les pages éditables (légales, contact, placeholders) ──

const pageSectionSchema = z.object({
  title: z.string().min(1),
  body: z.string(),
})

const contactCardSchema = z.object({
  icon: z.string(),
  title: z.string().min(1),
  value: z.string().min(1),
  href: z.string().optional(),
})

const pageContentSchema = z.object({
  title: z.string().min(1),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  lastUpdated: z.string().optional(),
  intro: z.string().optional(),
  sections: z.array(pageSectionSchema),
  contactCards: z.array(contactCardSchema).optional(),
})

export const siteConfigPageSchema = z.record(
  z.enum(["fr", "en", "ar"]),
  pageContentSchema
)

export type SiteConfigPageInput = z.infer<typeof siteConfigPageSchema>
