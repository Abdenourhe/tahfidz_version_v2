// src/app/layout.tsx
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "TAHFIDZ — Plateforme de Mémorisation du Coran",
    template: "%s | TAHFIDZ",
  },
  description: "Plateforme complète de suivi et gestion de la mémorisation du Saint Coran",
  icons: { icon: "/favicon.ico" },
}

// Script injecté dans <head> AVANT hydration pour éviter le flash de thème
const themeInitScript = `
(function() {
  try {
    var theme  = localStorage.getItem('theme');
    var locale = localStorage.getItem('locale');
    if (theme === 'dark') document.documentElement.classList.add('dark');
    if (locale === 'ar') {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    }
  } catch(e) {}
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
