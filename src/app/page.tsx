// src/app/page.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getDashboardPath } from "@/lib/utils"
import { prisma } from "@/lib/prisma"
import LandingPage from "@/components/LandingPage"
import { defaultLandingContent, type LandingContent } from "@/lib/landing/default-content"

type Lang = "fr" | "en" | "ar"

export default async function RootPage() {
  const session = await auth()

  if (session?.user) {
    redirect(getDashboardPath(session.user.role))
  }

  const config = await prisma.siteConfig.findUnique({ where: { key: "landing" } })
  const landingContent = (config?.value as Record<Lang, LandingContent> | undefined) ?? defaultLandingContent

  return <LandingPage content={landingContent} />
}
