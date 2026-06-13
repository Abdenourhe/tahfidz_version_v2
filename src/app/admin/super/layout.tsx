// src/app/admin/super/layout.tsx
// Layout dédié au portail SUPERADMIN

export const dynamic = "force-dynamic"

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { SuperAdminSidebar } from "@/components/layout/SuperAdminSidebar"
import { TopBar } from "@/components/layout/TopBar"
import { AdminBottomNav } from "@/components/layout/AdminBottomNav"
import { MobileHeader } from "@/components/layout/MobileHeader"
import { Providers } from "@/components/Providers"

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user || session.user.role !== "SUPERADMIN") {
    redirect("/login")
  }

  return (
    <Providers session={session}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
          {/* Desktop sidebar */}
          <div className="admin-no-print hidden md:block">
            <SuperAdminSidebar
              user={session.user as any}
            />
          </div>

          <main className="flex-1 overflow-y-auto flex flex-col">
            <div className="admin-no-print hidden md:block"><TopBar /></div>
            <div className="admin-no-print md:hidden"><MobileHeader role="admin" /></div>

            <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-4 md:py-8 pb-24 md:pb-8">
              {children}
            </div>
          </main>

          {/* Mobile bottom nav */}
          <div className="admin-no-print md:hidden"><AdminBottomNav /></div>
      </div>
    </Providers>
  )
}
