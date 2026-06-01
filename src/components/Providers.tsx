"use client"
// src/components/Providers.tsx
import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "next-themes"
import { LanguageProvider } from "@/contexts/LanguageContext"
import type { Session } from "next-auth"

export function Providers({
  children,
  session,
}: {
  children: React.ReactNode
  session?: Session | null
}) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
