// src/app/docs/page.tsx
// Documentation utilisateur (placeholder).

import { LegalPageLayout } from "@/components/layout/LegalPageLayout"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Documentation",
  description: "Documentation complète de la plateforme TAHFIDZ.",
}

export default function DocsPage() {
  return (
    <LegalPageLayout title="Documentation">
      <p>
        La documentation complète de TAHFIDZ sera disponible prochainement. Elle couvrira la
        prise en main, la gestion des écoles, des élèves, des enseignants et des parents.
      </p>
      <p>
        Pour toute question urgente, contactez notre équipe via la{" "}
        <a href="/contact" className="text-tahfidz-green hover:underline">page de contact</a>.
      </p>
    </LegalPageLayout>
  )
}
