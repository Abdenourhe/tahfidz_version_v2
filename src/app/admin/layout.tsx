// src/app/admin/layout.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AdminSidebar } from "@/components/layout/AdminSidebar"
import { TopBar } from "@/components/layout/TopBar"
import { Providers } from "@/components/Providers"
import { LanguageProvider } from "@/contexts/LanguageContext"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) redirect("/login")

  const role = session.user.role

  // SUPERADMIN : layout minimaliste sans sidebar (a son propre header)
  if (role === "SUPERADMIN") {
    return (
      <Providers session={session}>
        {children}
      </Providers>
    )
  }

  // ADMIN normal : sidebar + contenu
  if (role !== "ADMIN") redirect("/login")

  // Charger le logo et nom de l'école pour la sidebar
  const school = await prisma.school.findUnique({
    where: { id: session.user.schoolId },
    select: { name: true, nameAr: true, logo: true },
  })

  return (
    <Providers session={session}>
      <LanguageProvider>
        <div className="flex h-screen bg-gray-50 overflow-hidden">
          <AdminSidebar
            user={session.user as any}
            schoolName={school?.name}
            schoolLogo={school?.logo ?? undefined}
          />
          <main className="flex-1 overflow-y-auto flex flex-col">
            <TopBar />
            <div className="max-w-7xl mx-auto w-full px-6 py-8">
              {children}
            </div>
          </main>
        </div>
      </LanguageProvider>
    </Providers>
  )
}
