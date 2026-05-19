// src/app/student/layout.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { StudentSidebar } from "@/components/layout/StudentSidebar"
import { TopBar } from "@/components/layout/TopBar"
import { Providers } from "@/components/Providers"
import { LanguageProvider } from "@/contexts/LanguageContext"

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "STUDENT") redirect("/login")

  return (
    <Providers session={session}>
      <LanguageProvider>
        <div className="flex h-screen bg-gray-50 overflow-hidden">
          <StudentSidebar user={(session.user as any)} />
          <main className="flex-1 overflow-y-auto flex flex-col">
         
            {children}
          </main>
        </div>
      </LanguageProvider>
    </Providers>
  )
}
