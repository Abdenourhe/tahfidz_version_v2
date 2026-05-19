// src/app/parent/layout.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ParentNav } from "@/components/layout/ParentNav"
import { Providers } from "@/components/Providers"
import { LanguageProvider } from "@/contexts/LanguageContext"

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "PARENT") redirect("/login")

  return (
    <Providers session={session}>
      <LanguageProvider>
        <div className="flex flex-col screen bg-gray-50 overflow-hidden">
          <ParentNav user={(session.user as any)} />
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-5xl mx-auto px-6 py-8">{children}</div>
 
          </main>
        </div>
      </LanguageProvider>
    </Providers>
  )
}
