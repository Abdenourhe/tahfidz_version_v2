// src/app/page.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getDashboardPath } from "@/lib/utils"
import { prisma } from "@/lib/prisma"
import LandingPage from "@/components/landing/LandingPage"
import { defaultLandingContent, normalizeLandingContent, type LandingContent } from "@/lib/landing/default-content"

type Lang = "fr" | "en" | "ar"

export const dynamic = "force-dynamic"

export default async function RootPage() {
  const session = await auth()

  if (session?.user) {
    redirect(getDashboardPath(session.user.role))
  }

  const config = await prisma.siteConfig.findUnique({ where: { key: "landing" } })
  const rawContent = (config?.value as Record<Lang, LandingContent> | undefined) ?? defaultLandingContent
  const landingContent: Record<Lang, LandingContent> = {
    fr: normalizeLandingContent(rawContent.fr, "fr"),
    en: normalizeLandingContent(rawContent.en, "en"),
    ar: normalizeLandingContent(rawContent.ar, "ar"),
  }

  return <LandingPage content={landingContent} initialLang="fr" />
}
