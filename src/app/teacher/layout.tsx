// src/app/teacher/layout.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { TeacherSidebar } from "@/components/layout/TeacherSidebar"
import { TopBar } from "@/components/layout/TopBar"
import { Providers } from "@/components/Providers"
import { LanguageProvider } from "@/contexts/LanguageContext"

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "TEACHER"].includes(session.user.role)) redirect("/login")

  return (
    <Providers session={session}>
      <LanguageProvider>
        <div className="flex h-screen bg-gray-50 overflow-hidden">
          <TeacherSidebar user={(session.user as any)} />
          <main className="flex-1 overflow-y-auto flex flex-col">
            {children}
          </main>
        </div>
      </LanguageProvider>
    </Providers>
  )
}
