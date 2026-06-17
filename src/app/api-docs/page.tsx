// src/app/api-docs/page.tsx
// Documentation API (placeholder).

import { LegalPageLayout } from "@/components/layout/LegalPageLayout"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Documentation API",
  description: "Documentation technique de l'API TAHFIDZ.",
}

export default function ApiDocsPage() {
  return (
    <LegalPageLayout title="Documentation API">
      <p>
        La documentation technique de l&apos;API TAHFIDZ est en cours de rédaction. Elle permettra
        aux développeurs d&apos;intégrer la plateforme à leurs propres outils.
      </p>
      <p>
        Pour être averti de la disponibilité de l&apos;API,{" "}
        <a href="/contact" className="text-tahfidz-green hover:underline">contactez-nous</a>.
      </p>
    </LegalPageLayout>
  )
}
