// src/app/updates/page.tsx
// Page des mises à jour (placeholder).

import { LegalPageLayout } from "@/components/layout/LegalPageLayout"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Mises à jour",
  description: "Les dernières nouveautés et améliorations de TAHFIDZ.",
}

export default function UpdatesPage() {
  return (
    <LegalPageLayout title="Mises à jour">
      <p>
        Cette section sera bientôt disponible. Vous y retrouverez l&apos;historique des nouvelles
        fonctionnalités, améliorations et corrections de la plateforme TAHFIDZ.
      </p>
      <p>
        Pour être informé en temps réel des prochaines évolutions, suivez-nous sur nos réseaux ou
        contactez notre équipe.
      </p>
    </LegalPageLayout>
  )
}
