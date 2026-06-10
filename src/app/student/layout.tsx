// src/app/student/layout.tsx
export const dynamic = 'force-dynamic'

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { StudentSidebar } from "@/components/layout/StudentSidebar"
import { StudentBottomNav } from "@/components/layout/StudentBottomNav"
import { MobileHeader } from "@/components/layout/MobileHeader"
import { TopBar } from "@/components/layout/TopBar"
import { CollapsibleMain } from "@/components/layout/CollapsibleMain"
import { Providers } from "@/components/Providers"
import { LanguageProvider } from "@/contexts/LanguageContext"

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "STUDENT") redirect("/login")

  const school = await prisma.school.findUnique({
    where: { id: session.user.schoolId },
    select: { name: true, logo: true },
  })

  const userRecord = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { avatar: true, fullName: true },
  })

  const userWithAvatar = {
    name: userRecord?.fullName || session.user.name || "",
    email: session.user.email || "",
    avatar: userRecord?.avatar ?? undefined,
  }

  return (
    <Providers session={session}>
      <LanguageProvider>
        <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
          {/* Desktop sidebar */}
          <div className="hidden md:block">
            <StudentSidebar user={userWithAvatar} schoolName={school?.name ?? undefined} schoolLogo={school?.logo ?? undefined} />
          </div>

          <CollapsibleMain className="flex-col">
            <div className="hidden md:block"><TopBar /></div>
            <div className="md:hidden"><MobileHeader role="student" schoolName={school?.name ?? undefined} schoolLogo={school?.logo ?? undefined} /></div>

            <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-2 md:py-4 pb-24 md:pb-8">
              {children}
            </div>
          </CollapsibleMain>

          {/* Mobile bottom nav */}
          <div className="md:hidden"><StudentBottomNav /></div>
        </div>
      </LanguageProvider>
    </Providers>
  )
}
