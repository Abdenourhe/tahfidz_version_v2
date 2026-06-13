// src/app/admin/layout.tsx
export const dynamic = 'force-dynamic'

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AdminSidebar } from "@/components/layout/AdminSidebar"
import { AdminBottomNav } from "@/components/layout/AdminBottomNav"
import { MobileHeader } from "@/components/layout/MobileHeader"
import { TopBar } from "@/components/layout/TopBar"
import { Providers } from "@/components/Providers"
import { LanguageProvider } from "@/contexts/LanguageContext"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) redirect("/login")

  const role = session.user.role

  // SUPERADMIN : le layout spécifique /admin/super/layout.tsx gère l'UI
  if (role === "SUPERADMIN") {
    return <Providers session={session}>{children}</Providers>
  }

  // ADMIN normal : sidebar + contenu
  if (role !== "ADMIN") redirect("/login")

  const school = await prisma.school.findUnique({
    where: { id: session.user.schoolId },
    select: { name: true, nameAr: true, logo: true, slug: true, city: true },
  })

  return (
    <Providers session={session}>
      <LanguageProvider>
        <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
          {/* Desktop sidebar */}
          <div className="admin-no-print hidden md:block">
            <AdminSidebar
              user={session.user as any}
              schoolName={school?.name}
              schoolLogo={school?.logo ?? undefined}
              schoolSlug={school?.slug}
              schoolCity={school?.city ?? undefined}
            />
          </div>

          <main className="flex-1 overflow-y-auto flex flex-col">
            <div className="admin-no-print hidden md:block"><TopBar /></div>
            <div className="admin-no-print md:hidden"><MobileHeader role="admin" schoolName={school?.name ?? undefined} schoolLogo={school?.logo ?? undefined} /></div>

            <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-4 md:py-8 pb-24 md:pb-8">
              {children}
            </div>
          </main>

          {/* Mobile bottom nav */}
          <div className="admin-no-print md:hidden"><AdminBottomNav /></div>
        </div>
      </LanguageProvider>
    </Providers>
  )
}
