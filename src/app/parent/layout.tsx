// src/app/parent/layout.tsx
export const dynamic = 'force-dynamic'

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ParentNav } from "@/components/layout/ParentNav"
import { ParentBottomNav } from "@/components/layout/ParentBottomNav"
import { MobileHeader } from "@/components/layout/MobileHeader"
import { Providers } from "@/components/Providers"
import { LanguageProvider } from "@/contexts/LanguageContext"

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  // La protection est gérée par le middleware (src/middleware.ts)
  // On garde session pour passer aux composants de nav

  return (
    <Providers session={session}>
      <LanguageProvider>
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
          {/* Desktop header */}
          <div className="hidden md:block"><ParentNav user={(session?.user as any)} /></div>
          {/* Mobile header */}
          <div className="md:hidden"><MobileHeader role="parent" /></div>

          <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
            <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 md:py-8">
              {children}
            </div>
          </main>

          {/* Mobile bottom nav */}
          <div className="md:hidden"><ParentBottomNav /></div>
        </div>
      </LanguageProvider>
    </Providers>
  )
}
