// src/app/register-school/page.tsx — Server component avec Suspense pour useSearchParams

import { Suspense } from "react"
import RegisterSchoolClient from "./RegisterSchoolClient"

export const metadata = {
  title: "Inscrire mon école — TAHFIDZ",
  description: "Demandez l'inscription de votre école coranique sur TAHFIDZ.",
}

export default function RegisterSchoolPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-tahfidz-green-light/30 dark:from-gray-950 dark:via-gray-950 dark:to-emerald-900/10">
        <div className="flex flex-col items-center gap-3 text-tahfidz-green">
          <div className="w-8 h-8 border-4 border-tahfidz-green/30 border-t-tahfidz-green rounded-full animate-spin" />
          <span className="text-sm font-medium">Chargement du formulaire...</span>
        </div>
      </div>
    }>
      <RegisterSchoolClient />
    </Suspense>
  )
}
