// src/app/layout.tsx
import type { Metadata, Viewport } from "next"
import { Inter, Playfair_Display, Cormorant_Garamond } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/Providers"

const inter = Inter({ subsets: ["latin"] })

// Polices pour les certificats premium
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "700"],
})

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
  weight: ["400", "600"],
  style: ["normal", "italic"],
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1D9E75" },
    { media: "(prefers-color-scheme: dark)", color: "#065f46" },
  ],
}

export const metadata: Metadata = {
  title: {
    default: "TAHFIDZ — Plateforme de Mémorisation du Coran",
    template: "%s | TAHFIDZ",
  },
  description: "Plateforme complète de suivi et gestion de la mémorisation du Saint Coran",
  icons: { icon: "/favicon.ico" },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TAHFIDZ",
  },
}

// Script injecté dans <head> AVANT hydration pour la locale RTL
const localeInitScript = `
(function() {
  try {
    var locale = localStorage.getItem('locale');
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
        <script dangerouslySetInnerHTML={{ __html: localeInitScript }} />
        {/* Polices arabes pour les certificats — chargées via Google Fonts CDN */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Scheherazade+New:wght@400;700&family=Reem+Kufi:wght@400;700&family=Noto+Naskh+Arabic:wght@400;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className={`${inter.className} ${playfair.variable} ${cormorant.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}