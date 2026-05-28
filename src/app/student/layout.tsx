// src/app/student/layout.tsx
export const dynamic = 'force-dynamic'

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { StudentSidebar } from "@/components/layout/StudentSidebar"
import { StudentBottomNav } from "@/components/layout/StudentBottomNav"
import { MobileHeader } from "@/components/layout/MobileHeader"
import { TopBar } from "@/components/layout/TopBar"
import { Providers } from "@/components/Providers"
import { LanguageProvider } from "@/contexts/LanguageContext"

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "STUDENT") redirect("/login")

  return (
    <Providers session={session}>
      <LanguageProvider>
        <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
          {/* Desktop sidebar */}
          <div className="hidden md:block">
            <StudentSidebar user={(session.user as any)} />
          </div>

          <main className="flex-1 overflow-y-auto flex flex-col md:ml-64">
            <div className="hidden md:block"><TopBar /></div>
            <div className="md:hidden"><MobileHeader role="student" /></div>

            <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-4 md:py-8 pb-24 md:pb-8">
              {children}
            </div>
          </main>

          {/* Mobile bottom nav */}
          <div className="md:hidden"><StudentBottomNav /></div>
        </div>
      </LanguageProvider>
    </Providers>
  )
}
