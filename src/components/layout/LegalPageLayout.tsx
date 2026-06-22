// src/components/layout/LegalPageLayout.tsx
// Layout partagé pour les pages légales et informatives.

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { LogoHorizontal } from "@/components/ui/Logo"

interface LegalPageLayoutProps {
  children: React.ReactNode
  title: string
  lastUpdated?: string
}

export function LegalPageLayout({ children, title, lastUpdated }: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Header minimal */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <LogoHorizontal iconSize={36} textWidth={80} textHeight={19} gap={5} priority />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-tahfidz-green transition"
          >
            <ArrowLeft size={16} />
            Retour
          </Link>
        </div>
      </header>

      {/* Contenu */}
      <main className="px-4 py-12 sm:px-6 lg:px-8">
        <article className="max-w-3xl mx-auto">
          <div className="mb-8 pb-8 border-b border-gray-100 dark:border-gray-800">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">{title}</h1>
            {lastUpdated && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Dernière mise à jour : {lastUpdated}
              </p>
            )}
          </div>

          <div className="space-y-8 text-gray-600 dark:text-gray-300 leading-relaxed">
            {children}
          </div>
        </article>
      </main>

      {/* Footer minimal */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} TAHFIDZ. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  )
}
