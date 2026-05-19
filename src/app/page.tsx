// src/app/page.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getDashboardPath } from "@/lib/utils"
import LandingPage from "@/components/LandingPage"

export default async function RootPage() {
  const session = await auth()

  if (session?.user) {
    redirect(getDashboardPath(session.user.role))
  }

  return <LandingPage />
}
